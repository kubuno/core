// Android library shared by every Kubuno app's UI: the design tokens
// transcribed from the web (theme, colours, typography) and the small pure
// helpers (size/date formatting). This is what keeps the apps looking alike.
//
// It deliberately holds only what is genuinely cross-app. App-specific shells,
// screens and icon sets stay in their app; a widget graduates here once a
// second app needs it, never speculatively.
plugins {
    alias(libs.plugins.android.library)
    alias(libs.plugins.kotlin.android)
    alias(libs.plugins.kotlin.compose)
}

android {
    namespace = "com.kubuno.android.ui"
    compileSdk = 36

    defaultConfig {
        minSdk = 26
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    buildFeatures {
        compose = true
    }
}

kotlin {
    compilerOptions {
        jvmTarget.set(org.jetbrains.kotlin.gradle.dsl.JvmTarget.JVM_17)
    }
}

dependencies {
    val composeBom = platform(libs.compose.bom)
    api(composeBom)
    api(libs.compose.ui)
    api(libs.compose.material3)
    api(libs.compose.material.icons)
    implementation(libs.compose.ui.tooling.preview)
    debugImplementation(libs.compose.ui.tooling)

    // The avatar loads a profile picture; apps supply the authenticated loader.
    api(libs.coil.compose)
}
