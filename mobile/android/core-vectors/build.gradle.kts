// Pure JVM module: the runner for Kubuno's shared conformance vectors
// (format 1, see core/vectors/conformance-vectors.schema.json). Test-only
// helper: consumers add it as testImplementation and run vendored suites
// against their own implementation of a shared algorithm.
plugins {
    alias(libs.plugins.kotlin.jvm)
}

java {
    sourceCompatibility = JavaVersion.VERSION_17
    targetCompatibility = JavaVersion.VERSION_17
}

kotlin {
    compilerOptions {
        jvmTarget.set(org.jetbrains.kotlin.gradle.dsl.JvmTarget.JVM_17)
    }
}

dependencies {
    // JsonElement is the currency of the runner's API.
    api(libs.kotlinx.serialization.json)
    // assertSuite reports through JUnit 4 (failures and assumption skips).
    api(libs.junit)
}
