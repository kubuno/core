package com.kubuno.android.account

import android.accounts.Account
import android.accounts.AccountManager
import android.content.Context
import android.content.pm.PackageManager
import android.os.Build
import android.os.Bundle
import android.util.Log
import java.security.MessageDigest
import dagger.hilt.android.qualifiers.ApplicationContext
import javax.inject.Inject
import javax.inject.Singleton
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext

/**
 * Mirrors [AccountRegistry] into the system's `AccountManager`.
 *
 * The registry stays the source of truth — it is what this app reads and
 * writes. The system accounts exist only so that *other* Kubuno apps can
 * discover which accounts are signed in here and ask [KubunoAuthenticator] for
 * an access token. This is a one-way projection: nothing is ever read back
 * from AccountManager into the registry.
 *
 * Every method touches the AccountManager database and is therefore
 * `suspend` + [Dispatchers.IO]: none of it may run on the main thread.
 */
@Singleton
class AccountManagerBridge @Inject constructor(
    @ApplicationContext private val context: Context,
    private val registry: AccountRegistry,
) {
    private val manager: AccountManager = AccountManager.get(context)
    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.IO)

    /**
     * Mirrors the registry from now on. Idempotent; call once from
     * `Application.onCreate`. The first emission of the flow does the initial
     * reconciliation, which also repairs whatever a crash left half-written.
     */
    fun install() {
        scope.launch {
            registry.accounts.collect {
                runCatching { sync() }
                    .onFailure { Log.w(TAG, "Could not mirror accounts", it) }
            }
        }
    }

    /**
     * Makes the system accounts match the registry: creates the missing ones,
     * refreshes the user data of the existing ones, and drops the ones the
     * user has forgotten in the app.
     *
     * Matching is done on the `account_id` user data, never on the display
     * name — a rename (new display name, instance moved domain) must not be
     * seen as "old account gone, new account appeared", which would make
     * sibling apps lose their binding.
     */
    suspend fun sync() = withContext(Dispatchers.IO) {
        val records = registry.accounts.value
        val system = manager.getAccountsByType(KubunoAccounts.TYPE)

        // Additive only. This runs in EVERY Kubuno app, but a system account may
        // belong to a sibling app whose registry this process cannot see —
        // pruning "accounts not in my registry" would let a consumer app (an
        // empty registry) delete the accounts the owner created. Removal is
        // therefore explicit: an app drops an account through remove() when the
        // user signs out of it here, never as a side effect of mirroring.
        val byId = system.mapNotNull { account ->
            manager.getUserData(account, KubunoAccounts.USER_DATA_ACCOUNT_ID)
                ?.let { it to account }
        }.toMap()
        val takenNames = system.mapTo(mutableSetOf()) { it.name }
        val siblings = siblingPackages()
        for (account in system) grantVisibility(account, siblings)
        for (record in records) {
            val existing = byId[record.id.value]
            if (existing != null) {
                writeUserData(existing, record)
                continue
            }
            val name = uniqueName(record, takenNames)
            val account = Account(name, KubunoAccounts.TYPE)
            // Password is null on purpose. AccountManager stores it in a plain
            // (unencrypted at the app level) system database, while our own
            // session store is AES-GCM under a non-exportable Keystore key.
            // The refresh token would be the only thing worth putting there,
            // and it must never leave this app — sharing it would let a second
            // process rotate concurrently and get the whole session family
            // revoked. Sibling apps get access tokens through getAuthToken().
            val added = runCatching {
                manager.addAccountExplicitly(account, null, userData(record))
            }.onFailure {
                Log.w(TAG, "Could not add system account", it)
            }.getOrDefault(false)
            if (added) {
                takenNames += name
                grantVisibility(account, siblings)
            }
        }
    }

    /**
     * Makes [account] readable by the other Kubuno apps.
     *
     * Since Android O an account is invisible to an app unless it owns the
     * authenticator or is granted visibility — and the same-signature default
     * stops applying once a second app declares the same authenticator, which
     * is exactly our case. So the owner grants visibility explicitly, gated on
     * a shared signing certificate: only genuine Kubuno apps, never a package
     * that merely guessed the "com.kubuno" type.
     */
    private fun grantVisibility(account: Account, siblingPackages: List<String>) {
        for (pkg in siblingPackages) {
            runCatching {
                manager.setAccountVisibility(account, pkg, AccountManager.VISIBILITY_VISIBLE)
            }.onFailure { Log.w(TAG, "Could not grant visibility to $pkg", it) }
        }
    }

    /** Installed packages, other than us, signed with our certificate. */
    private fun siblingPackages(): List<String> {
        val pm = context.packageManager
        val mine = signaturesOf(context.packageName) ?: return emptyList()
        @Suppress("DEPRECATION", "QueryPermissionsNeeded")
        return pm.getInstalledPackages(0)
            .map { it.packageName }
            .filter { it != context.packageName }
            .filter { signaturesOf(it)?.let { sig -> sig.intersect(mine).isNotEmpty() } == true }
    }

    /** The app's signing certificates as SHA-256 hex, across API levels. */
    private fun signaturesOf(pkg: String): Set<String>? = runCatching {
        val pm = context.packageManager
        val signatures = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
            val info = pm.getPackageInfo(pkg, PackageManager.GET_SIGNING_CERTIFICATES)
            val signing = info.signingInfo ?: return@runCatching null
            if (signing.hasMultipleSigners()) signing.apkContentsSigners else signing.signingCertificateHistory
        } else {
            @Suppress("DEPRECATION")
            pm.getPackageInfo(pkg, PackageManager.GET_SIGNATURES).signatures
        }
        signatures?.mapNotNull { sig ->
            val digest = MessageDigest.getInstance("SHA-256").digest(sig.toByteArray())
            digest.joinToString("") { "%02x".format(it) }
        }?.toSet()
    }.getOrNull()

    /**
     * Name the system knows [id] by, once [sync] has run. Used to answer an
     * `AccountManagerFuture` with the account that was just added.
     */
    suspend fun systemName(id: AccountId): String? = withContext(Dispatchers.IO) {
        manager.getAccountsByType(KubunoAccounts.TYPE)
            .firstOrNull { manager.getUserData(it, KubunoAccounts.USER_DATA_ACCOUNT_ID) == id.value }
            ?.name
    }

    /** Drops the system account mirroring [record], if it is still there. */
    suspend fun remove(record: AccountRecord) = withContext(Dispatchers.IO) {
        manager.getAccountsByType(KubunoAccounts.TYPE)
            .filter { manager.getUserData(it, KubunoAccounts.USER_DATA_ACCOUNT_ID) == record.id.value }
            .forEach { account ->
                runCatching { manager.removeAccountExplicitly(account) }
                    .onFailure { Log.w(TAG, "Could not remove system account", it) }
            }
    }

    private fun userData(record: AccountRecord) = Bundle().apply {
        putString(KubunoAccounts.USER_DATA_ACCOUNT_ID, record.id.value)
        putString(KubunoAccounts.USER_DATA_SERVER_URL, record.serverUrl)
        putString(KubunoAccounts.USER_DATA_USER_ID, record.userId)
        putString(KubunoAccounts.USER_DATA_EMAIL, record.email)
        putString(KubunoAccounts.USER_DATA_DISPLAY_NAME, record.displayName)
    }

    private fun writeUserData(account: Account, record: AccountRecord) {
        val data = userData(record)
        for (key in data.keySet()) {
            val value = data.getString(key)
            if (manager.getUserData(account, key) != value) {
                runCatching { manager.setUserData(account, key, value) }
                    .onFailure { Log.w(TAG, "Could not update user data $key", it) }
            }
        }
    }

    /**
     * Account names must be unique within a type, and "label (host)" is not
     * guaranteed to be: two accounts on the same instance can share a display
     * name. Fall back to a short slice of the (unique) account id.
     */
    private fun uniqueName(record: AccountRecord, taken: Set<String>): String {
        val base = "${record.label} (${record.host})"
        if (base !in taken) return base
        return "$base #${record.id.value.take(8)}"
    }

    private companion object {
        const val TAG = "AccountManagerBridge"
    }
}
