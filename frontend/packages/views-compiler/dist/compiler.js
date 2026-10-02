const encoder = new TextEncoder();
const decoder = new TextDecoder();
/** The raw request channel to one instance of the compiler. */
export class CompilerWasm {
    ex;
    constructor(ex) {
        this.ex = ex;
    }
    /** Instantiates the compiler from the `.wasm` bytes (or an already compiled module). */
    static async instantiate(source) {
        const instance = source instanceof WebAssembly.Module
            ? await WebAssembly.instantiate(source, {})
            : (await WebAssembly.instantiate(source, {})).instance;
        return new CompilerWasm(instance.exports);
    }
    /** Sends one request; returns its `result` (throws on `{ok: false}`). */
    call(request) {
        const bytes = encoder.encode(JSON.stringify(request));
        const ptr = this.ex.kb_alloc(bytes.length);
        new Uint8Array(this.ex.memory.buffer, ptr, bytes.length).set(bytes);
        const packed = this.ex.kb_call(ptr, bytes.length);
        const outPtr = Number(packed >> 32n);
        const outLen = Number(packed & 0xffffffffn);
        // Copy before freeing: the memory may grow (and detach views) on the next call.
        const text = decoder.decode(new Uint8Array(this.ex.memory.buffer, outPtr, outLen).slice());
        this.ex.kb_free(outPtr, outLen);
        const response = JSON.parse(text);
        if (!response.ok)
            throw new Error(`@kubuno/views-compiler: ${response.error ?? 'unknown error'}`);
        return response.result;
    }
}
/**
 * A registry loaded once, then many compiles. Registries: the host's (`kbview-registry.web.json` of
 * `@kubuno/ui`, `host: true`) first, then the project's own control registries (`host: false`).
 */
export class ViewCompiler {
    wasm;
    session;
    constructor(wasm) {
        this.wasm = wasm;
        this.session = wasm.call({ op: 'session_new' }).session;
    }
    version() {
        const v = this.wasm.call({ op: 'version' });
        return { compiler: v.compiler, abi: v.abi };
    }
    /** Adds a registry document; returns how many elements the registry has now. */
    addRegistry(json, label, host) {
        return this.wasm.call({ op: 'add_registry', session: this.session, json, label, host }).elements;
    }
    /** Replaces the project's user controls (`.kbcontrol` files). */
    setUserControls(controls) {
        this.wasm.call({ op: 'set_user_controls', session: this.session, controls });
    }
    compile(source, options) {
        const out = this.wasm.call({ op: 'compile', session: this.session, source, options });
        return out;
    }
    /** The handle interfaces of every element of the registry (`@kubuno/views`' `handles.generated.ts`). */
    handleTypes() {
        return this.wasm.call({ op: 'handle_types', session: this.session }).text;
    }
    dispose() {
        this.wasm.call({ op: 'session_free', session: this.session });
    }
}
