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

rootProject.name = "kubuno-android"

include(":app-drive")
include(":app-mail")
include(":app-maps")
include(":app-chat")
include(":app-photos")
include(":app-docs")
include(":core-api")
include(":core-account")
include(":core-ui")
include(":core-viewer")
include(":core-sync")
include(":core-vectors")
