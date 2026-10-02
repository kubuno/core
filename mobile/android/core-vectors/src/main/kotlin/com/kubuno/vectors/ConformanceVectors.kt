package com.kubuno.vectors

import java.io.File
import java.security.MessageDigest
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.JsonArray
import kotlinx.serialization.json.JsonElement
import kotlinx.serialization.json.JsonNull
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.JsonPrimitive
import kotlinx.serialization.json.contentOrNull
import kotlinx.serialization.json.intOrNull
import org.junit.Assert.fail
import org.junit.AssumptionViolatedException

/** One case of a suite. */
data class VectorCase(
    val id: String,
    val input: JsonElement,
    val expected: JsonElement,
    val note: String? = null,
    /** platform -> reason; a case skipped for [ConformanceVectors.PLATFORM] is reported, not run. */
    val skip: Map<String, String> = emptyMap(),
)

/** A suite file (format 1). */
data class VectorSuite(
    val format: Int,
    val suite: String,
    val version: String,
    val description: String?,
    val reference: String?,
    val cases: List<VectorCase>,
)

/** A suite file that does not follow format 1 (or a broken VENDOR.json). */
class VectorFormatException(message: String) : IllegalArgumentException(message)

/** A case whose output differed from the expected one (or whose implementation threw). */
data class CaseFailure(val id: String, val expected: JsonElement, val actual: JsonElement?, val error: Throwable?)

/** What running a suite produced. */
data class SuiteResult(
    val suite: String,
    val passed: List<String>,
    val skipped: List<Pair<String, String>>,
    val failures: List<CaseFailure>,
) {
    /** Human-readable report listing every failing case, expected vs actual. */
    fun report(): String = buildString {
        append("suite ").append(suite).append(": ")
        append(passed.size).append(" passed, ")
        append(failures.size).append(" failed, ")
        append(skipped.size).append(" skipped")
        for ((id, reason) in skipped) append("\n  SKIP ").append(id).append(": ").append(reason)
        for (f in failures) {
            append("\n  FAIL ").append(f.id)
            append("\n    expected: ").append(f.expected)
            if (f.error != null) {
                append("\n    threw:    ").append(f.error.javaClass.simpleName).append(": ").append(f.error.message)
            } else {
                append("\n    actual:   ").append(f.actual)
            }
        }
    }
}

/**
 * Runner for Kubuno's shared conformance vectors (format 1, schema in
 * core/vectors/conformance-vectors.schema.json).
 *
 * Rules shared by every runner (Rust, TS, Kotlin, Swift):
 *  - a `format` other than 1 is refused, and so are duplicate case ids;
 *  - outputs compare as JSON: numbers by numeric value (1 == 1.0), object key
 *    order irrelevant, arrays ordered;
 *  - a case whose `skip` names `kotlin` is reported skipped with its reason;
 *  - a failing suite lists EVERY failing case, expected vs actual;
 *  - a vendored folder's VENDOR.json checksums are verified before running.
 */
object ConformanceVectors {
    const val FORMAT = 1
    const val PLATFORM = "kotlin"
    const val VENDOR_FILE = "VENDOR.json"

    private val json = Json

    /** Loads and validates a suite file. */
    fun load(file: File): VectorSuite = parse(file.readText(Charsets.UTF_8), file.name)

    /** Parses and validates a suite; [source] only names it in errors. */
    fun parse(text: String, source: String = "suite"): VectorSuite {
        val element = runCatching { json.parseToJsonElement(text) }
            .getOrElse { throw VectorFormatException("$source: not JSON (${it.message})") }
        val root = element as? JsonObject ?: throw VectorFormatException("$source: the root is not an object")

        val format = (root["format"] as? JsonPrimitive)?.takeUnless { it.isString }?.intOrNull
        if (format != FORMAT) {
            throw VectorFormatException("$source: unsupported format ${root["format"]} (this runner reads format $FORMAT)")
        }
        val suite = root.string("suite") ?: throw VectorFormatException("$source: missing \"suite\"")
        val version = root.string("version") ?: throw VectorFormatException("$source: missing \"version\"")
        val rawCases = root["cases"] as? JsonArray ?: throw VectorFormatException("$source: missing \"cases\" array")
        if (rawCases.isEmpty()) throw VectorFormatException("$source: \"cases\" is empty")

        val seen = HashSet<String>()
        val cases = rawCases.mapIndexed { index, item ->
            val case = item as? JsonObject ?: throw VectorFormatException("$source: case #$index is not an object")
            val id = case.string("id") ?: throw VectorFormatException("$source: case #$index has no \"id\"")
            if (!seen.add(id)) throw VectorFormatException("$source: duplicate case id \"$id\"")
            if (!case.containsKey("input")) throw VectorFormatException("$source: case \"$id\" has no \"input\"")
            if (!case.containsKey("expected")) throw VectorFormatException("$source: case \"$id\" has no \"expected\"")
            val skip = when (val raw = case["skip"]) {
                null, JsonNull -> emptyMap()
                is JsonObject -> raw.mapValues { (platform, reason) ->
                    (reason as? JsonPrimitive)?.takeIf { it.isString }?.content
                        ?: throw VectorFormatException("$source: case \"$id\" skip.$platform is not a string")
                }
                else -> throw VectorFormatException("$source: case \"$id\" skip is not an object")
            }
            VectorCase(
                id = id,
                input = case.getValue("input"),
                expected = case.getValue("expected"),
                note = case.string("note"),
                skip = skip,
            )
        }
        return VectorSuite(
            format = FORMAT,
            suite = suite,
            version = version,
            description = root.string("description"),
            reference = root.string("reference"),
            cases = cases,
        )
    }

    /**
     * Deep JSON equality: numbers by numeric value (1 == 1.0), object key order
     * irrelevant, arrays ordered, a string never equals a number or a boolean.
     */
    fun jsonEquals(a: JsonElement, b: JsonElement): Boolean = when {
        a is JsonNull || b is JsonNull -> a is JsonNull && b is JsonNull
        a is JsonObject && b is JsonObject ->
            a.keys == b.keys && a.all { (k, v) -> jsonEquals(v, b.getValue(k)) }
        a is JsonArray && b is JsonArray ->
            a.size == b.size && a.indices.all { jsonEquals(a[it], b[it]) }
        a is JsonPrimitive && b is JsonPrimitive -> primitiveEquals(a, b)
        else -> false
    }

    private fun primitiveEquals(a: JsonPrimitive, b: JsonPrimitive): Boolean {
        if (a.isString != b.isString) return false
        if (a.isString) return a.content == b.content
        val x = a.content.toBigDecimalOrNull()
        val y = b.content.toBigDecimalOrNull()
        if (x != null && y != null) return x.compareTo(y) == 0
        // Booleans (and anything else unquoted) compare literally.
        return x == null && y == null && a.content == b.content
    }

    /** SHA-256 of [bytes] after replacing every CRLF with LF, as "sha256:<hex>". */
    fun checksum(bytes: ByteArray): String {
        val normalized = java.io.ByteArrayOutputStream(bytes.size)
        var i = 0
        while (i < bytes.size) {
            val b = bytes[i]
            if (b == '\r'.code.toByte() && i + 1 < bytes.size && bytes[i + 1] == '\n'.code.toByte()) {
                i++
                continue
            }
            normalized.write(b.toInt())
            i++
        }
        val digest = MessageDigest.getInstance("SHA-256").digest(normalized.toByteArray())
        return "sha256:" + digest.joinToString("") { "%02x".format(it) }
    }

    /**
     * Verifies a vendored folder against its VENDOR.json: format 1, every
     * listed file present with the recorded checksum, and no unlisted suite
     * file. Fails (AssertionError) with a message asking to re-vendor.
     */
    fun verifyVendor(dir: File) {
        val vendorFile = File(dir, VENDOR_FILE)
        if (!vendorFile.isFile) fail("${dir.path}: no $VENDOR_FILE; vendor the suites with their checksums")
        val vendor = runCatching { json.parseToJsonElement(vendorFile.readText(Charsets.UTF_8)) as JsonObject }
            .getOrElse { throw VectorFormatException("${vendorFile.path}: not a JSON object (${it.message})") }
        val format = (vendor["format"] as? JsonPrimitive)?.takeUnless { it.isString }?.intOrNull
        if (format != FORMAT) throw VectorFormatException("${vendorFile.path}: unsupported format ${vendor["format"]}")
        val files = vendor["files"] as? JsonObject
            ?: throw VectorFormatException("${vendorFile.path}: missing \"files\" object")
        val origin = "${vendor.string("source") ?: "?"} @ ${vendor.string("ref") ?: "?"} / ${vendor.string("path") ?: "?"}"

        val problems = mutableListOf<String>()
        for ((name, value) in files) {
            val recorded = (value as? JsonPrimitive)?.takeIf { it.isString }?.content?.lowercase()
            val file = File(dir, name)
            when {
                recorded == null -> problems += "$name: checksum is not a string"
                !file.isFile -> problems += "$name: listed but missing"
                else -> {
                    val actual = checksum(file.readBytes())
                    if (actual != recorded) problems += "$name: expected $recorded, found $actual"
                }
            }
        }
        dir.listFiles { f -> f.isFile && f.name.endsWith(".json") && f.name != VENDOR_FILE }
            ?.filter { it.name !in files.keys }
            ?.forEach { problems += "${it.name}: present but not listed in $VENDOR_FILE" }

        if (problems.isNotEmpty()) {
            fail(
                "Vendored vectors in ${dir.path} do not match $VENDOR_FILE ($origin):\n  " +
                    problems.joinToString("\n  ") +
                    "\nRe-vendor the suites from the pinned tag (copy the files and recompute VENDOR.json)."
            )
        }
    }

    /** Runs every case of [suite] through [impl]; never throws for a failing case. */
    fun run(suite: VectorSuite, impl: (JsonElement) -> JsonElement): SuiteResult {
        val passed = mutableListOf<String>()
        val skipped = mutableListOf<Pair<String, String>>()
        val failures = mutableListOf<CaseFailure>()
        for (case in suite.cases) {
            val reason = case.skip[PLATFORM]
            if (reason != null) {
                skipped += case.id to reason
                continue
            }
            val actual = try {
                impl(case.input)
            } catch (e: Throwable) {
                if (e is VirtualMachineError) throw e
                failures += CaseFailure(case.id, case.expected, null, e)
                continue
            }
            if (jsonEquals(case.expected, actual)) passed += case.id
            else failures += CaseFailure(case.id, case.expected, actual, null)
        }
        return SuiteResult(suite.suite, passed, skipped, failures)
    }

    /**
     * JUnit entry point: verifies the folder's VENDOR.json when there is one,
     * loads [file], runs every case through [impl] and fails listing every
     * failing case. Skipped cases are printed; when every case is skipped the
     * test is reported as skipped (assumption failure).
     */
    fun assertSuite(file: File, impl: (JsonElement) -> JsonElement): SuiteResult {
        val dir = file.absoluteFile.parentFile
        if (dir != null && File(dir, VENDOR_FILE).isFile) verifyVendor(dir)
        val result = run(load(file), impl)
        if (result.skipped.isNotEmpty() || result.failures.isNotEmpty()) println(result.report())
        if (result.failures.isNotEmpty()) fail(result.report())
        if (result.passed.isEmpty() && result.skipped.isNotEmpty()) {
            throw AssumptionViolatedException("every case of ${result.suite} is skipped on $PLATFORM")
        }
        return result
    }

    /** A test resource as a file (resources of a JVM/Android unit test live on disk). */
    fun resource(path: String, anchor: Class<*> = ConformanceVectors::class.java): File {
        val url = anchor.getResource(if (path.startsWith("/")) path else "/$path")
            ?: throw IllegalArgumentException("test resource not found: $path")
        return File(url.toURI())
    }

    private fun JsonObject.string(key: String): String? =
        (this[key] as? JsonPrimitive)?.takeIf { it.isString }?.contentOrNull
}
