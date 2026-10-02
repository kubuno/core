package com.kubuno.vectors

import java.io.File
import java.nio.file.Files
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.JsonElement
import kotlinx.serialization.json.JsonPrimitive
import kotlinx.serialization.json.int
import kotlinx.serialization.json.jsonObject
import kotlinx.serialization.json.jsonPrimitive
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Assert.fail
import org.junit.Test

class ConformanceVectorsTest {

    private fun j(text: String): JsonElement = Json.parseToJsonElement(text)

    private fun tempDir(): File = Files.createTempDirectory("vectors").toFile().apply { deleteOnExit() }

    private val doubling = """
        {
          "format": 1,
          "suite": "test.double",
          "version": "1.0.0",
          "cases": [
            { "id": "one", "input": 1, "expected": 2 },
            { "id": "two", "input": 2, "expected": 4.0 },
            { "id": "skipped", "input": 3, "expected": 0, "skip": { "kotlin": "known divergence", "ts": "other" } },
            { "id": "rust-only-skip", "input": 5, "expected": 10, "skip": { "rust": "not kotlin" } }
          ]
        }
    """.trimIndent()

    private val double: (JsonElement) -> JsonElement = { JsonPrimitive(it.jsonPrimitive.int * 2) }

    // ---- equality ----------------------------------------------------------

    @Test
    fun `numbers compare by numeric value`() {
        assertTrue(ConformanceVectors.jsonEquals(j("1"), j("1.0")))
        assertTrue(ConformanceVectors.jsonEquals(j("2000"), j("2e3")))
        assertTrue(ConformanceVectors.jsonEquals(j("""{"delay_ms":2000}"""), j("""{"delay_ms":2000.0}""")))
        assertFalse(ConformanceVectors.jsonEquals(j("1"), j("1.5")))
    }

    @Test
    fun `strings never equal numbers or booleans`() {
        assertFalse(ConformanceVectors.jsonEquals(j("\"1\""), j("1")))
        assertFalse(ConformanceVectors.jsonEquals(j("\"true\""), j("true")))
        assertFalse(ConformanceVectors.jsonEquals(j("null"), j("\"null\"")))
        assertTrue(ConformanceVectors.jsonEquals(j("null"), j("null")))
        assertTrue(ConformanceVectors.jsonEquals(j("true"), j("true")))
        assertFalse(ConformanceVectors.jsonEquals(j("true"), j("false")))
    }

    @Test
    fun `object key order is irrelevant, arrays are ordered`() {
        assertTrue(ConformanceVectors.jsonEquals(j("""{"a":1,"b":[1,2]}"""), j("""{"b":[1,2],"a":1.0}""")))
        assertFalse(ConformanceVectors.jsonEquals(j("""{"a":1}"""), j("""{"a":1,"b":null}""")))
        assertFalse(ConformanceVectors.jsonEquals(j("[1,2]"), j("[2,1]")))
        assertFalse(ConformanceVectors.jsonEquals(j("[1]"), j("[1,1]")))
    }

    // ---- loading -----------------------------------------------------------

    @Test
    fun `refuses a format other than 1`() {
        for (format in listOf("2", "\"1\"", "0", "null")) {
            try {
                ConformanceVectors.parse("""{"format":$format,"suite":"a.b","version":"1.0.0","cases":[{"id":"x","input":1,"expected":1}]}""")
                fail("format $format was accepted")
            } catch (e: VectorFormatException) {
                assertTrue(e.message!!.contains("format"))
            }
        }
    }

    @Test
    fun `refuses duplicate case ids`() {
        try {
            ConformanceVectors.parse(
                """{"format":1,"suite":"a.b","version":"1.0.0","cases":[
                   {"id":"x","input":1,"expected":1},{"id":"x","input":2,"expected":2}]}"""
            )
            fail("duplicate ids were accepted")
        } catch (e: VectorFormatException) {
            assertTrue(e.message!!.contains("duplicate"))
        }
    }

    @Test
    fun `a null expected is a value, a missing one is an error`() {
        val suite = ConformanceVectors.parse(
            """{"format":1,"suite":"a.b","version":"1.0.0","cases":[{"id":"x","input":1,"expected":null}]}"""
        )
        assertEquals(j("null"), suite.cases.single().expected)
        try {
            ConformanceVectors.parse("""{"format":1,"suite":"a.b","version":"1.0.0","cases":[{"id":"x","input":1}]}""")
            fail("a case without expected was accepted")
        } catch (e: VectorFormatException) {
            // expected
        }
    }

    // ---- running -----------------------------------------------------------

    @Test
    fun `skips the cases skipped for kotlin and reports the reason`() {
        val result = ConformanceVectors.run(ConformanceVectors.parse(doubling), double)
        assertEquals(listOf("one", "two", "rust-only-skip"), result.passed)
        assertEquals(listOf("skipped" to "known divergence"), result.skipped)
        assertTrue(result.failures.isEmpty())
        assertTrue(result.report().contains("SKIP skipped: known divergence"))
    }

    @Test
    fun `lists every failing case, not only the first`() {
        val wrong: (JsonElement) -> JsonElement = { input ->
            when (input.jsonPrimitive.int) {
                1 -> JsonPrimitive(3)
                2 -> error("boom")
                else -> JsonPrimitive(input.jsonPrimitive.int * 2)
            }
        }
        val result = ConformanceVectors.run(ConformanceVectors.parse(doubling), wrong)
        assertEquals(listOf("one", "two"), result.failures.map { it.id })
        val report = result.report()
        assertTrue(report.contains("FAIL one"))
        assertTrue(report.contains("actual:   3"))
        assertTrue(report.contains("FAIL two"))
        assertTrue(report.contains("boom"))

        val dir = tempDir()
        val file = File(dir, "double.json").apply { writeText(doubling) }
        try {
            ConformanceVectors.assertSuite(file, wrong)
            fail("assertSuite passed a failing suite")
        } catch (e: AssertionError) {
            assertTrue(e.message!!.contains("FAIL one"))
            assertTrue(e.message!!.contains("FAIL two"))
        }
    }

    // ---- vendoring ---------------------------------------------------------

    private fun vendor(dir: File, files: Map<String, String>) {
        val entries = files.entries.joinToString(",") { (name, sum) -> "\"$name\":\"$sum\"" }
        File(dir, "VENDOR.json").writeText(
            """{"format":1,"source":"https://github.com/kubuno/core","ref":"vectors-v0.1.0","path":"vectors/test","files":{$entries}}"""
        )
    }

    @Test
    fun `checksum ignores CRLF line endings`() {
        val lf = "{\n  \"a\": 1\n}\n".toByteArray()
        val crlf = "{\r\n  \"a\": 1\r\n}\r\n".toByteArray()
        assertEquals(ConformanceVectors.checksum(lf), ConformanceVectors.checksum(crlf))
        // SHA-256 of the empty input, a known value.
        assertEquals(
            "sha256:e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
            ConformanceVectors.checksum(ByteArray(0)),
        )
    }

    @Test
    fun `a vendored folder with matching checksums passes`() {
        val dir = tempDir()
        val file = File(dir, "double.json").apply { writeText(doubling.replace("\n", "\r\n")) }
        vendor(dir, mapOf("double.json" to ConformanceVectors.checksum(doubling.toByteArray())))
        ConformanceVectors.verifyVendor(dir)
        val result = ConformanceVectors.assertSuite(file, double)
        assertEquals(3, result.passed.size)
    }

    @Test
    fun `a checksum mismatch fails and asks to re-vendor`() {
        val dir = tempDir()
        val file = File(dir, "double.json").apply { writeText(doubling) }
        vendor(dir, mapOf("double.json" to "sha256:" + "0".repeat(64)))
        try {
            ConformanceVectors.assertSuite(file, double)
            fail("a checksum mismatch was accepted")
        } catch (e: AssertionError) {
            assertTrue(e.message!!.contains("double.json"))
            assertTrue(e.message!!.contains("Re-vendor"))
        }
    }

    @Test
    fun `missing or unlisted files fail the vendor check`() {
        val dir = tempDir()
        File(dir, "extra.json").writeText(doubling)
        vendor(dir, mapOf("gone.json" to ConformanceVectors.checksum(ByteArray(0))))
        try {
            ConformanceVectors.verifyVendor(dir)
            fail("missing and unlisted files were accepted")
        } catch (e: AssertionError) {
            assertTrue(e.message!!.contains("gone.json: listed but missing"))
            assertTrue(e.message!!.contains("extra.json: present but not listed"))
        }
    }

    @Test
    fun `suite metadata is read`() {
        val suite = ConformanceVectors.parse(doubling)
        assertEquals("test.double", suite.suite)
        assertEquals("1.0.0", suite.version)
        assertEquals(4, suite.cases.size)
        assertEquals(1, suite.cases.first().input.jsonPrimitive.int)
        assertTrue(j("""{"k":1}""").jsonObject.containsKey("k"))
    }
}
