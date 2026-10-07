// Kubuno mobile foundation: the libraries every Kubuno mobile app shares
// (API client, device accounts, UI components, viewers, conformance-vector runner).
//
// The Gradle root is mobile/; projects live in per-platform folders: android/
// today, common/ once the Kotlin Multiplatform conversion lands (README.md).
// The apps themselves live in their module's repository (<module>/mobile/) and
// consume these libraries as published Maven artifacts com.kubuno.mobile:<name>.
pluginManagement {
    repositories {
        google {
            content {
                includeGroupByRegex("com\\.android.*")
                includeGroupByRegex("com\\.google.*")
                includeGroupByRegex("androidx.*")
            }
        }
        mavenCentral()
        gradlePluginPortal()
    }
}

dependencyResolutionManagement {
    repositoriesMode.set(RepositoriesMode.FAIL_ON_PROJECT_REPOS)
    repositories {
        google()
        mavenCentral()
    }
}

rootProject.name = "kubuno-mobile"

// Project name = published artifactId; keep them stable, module apps depend on them.
for (name in listOf("core-api", "core-account", "core-ui", "core-viewer", "core-vectors")) {
    include(":$name")
    project(":$name").projectDir = file("android/$name")
}
