# Vocabulary

Use these words exactly, in the report and the conversation. Consistent words are the point: "service" in one card and "module" in the next makes two candidates look like different kinds of problem. Adapted from Matt Pocock's `codebase-design` skill.

| Term | Means | Don't say |
|---|---|---|
| **Module** | Anything with an interface and an implementation, at any scale: a function, a class, a use case, a package, a slice across rings. | unit, component, service |
| **Interface** | Everything a caller must know to use the module correctly: the types, plus invariants, ordering, error modes, required configuration and performance. | API, signature |
| **Implementation** | The code inside the module. | |
| **Depth** | Behaviour a caller or a test gets per unit of interface they have to learn. **Deep**: a lot of behaviour behind a small interface. **Shallow**: the interface is nearly as complex as the implementation. | |
| **Seam** | A place where behaviour can change without editing that place: where an interface lives. Where to put it is its own decision. | boundary |
| **Adapter** | A concrete thing that fills a seam. A role, not a kind: the PostgreSQL store and the in-memory fake are both adapters. | |
| **Leverage** | What callers get from depth: more capability per thing learned. | |
| **Locality** | What maintainers get from depth: a change, a bug and its test all live in one place. | |

Never write "cleaner", "easier to maintain" or "better separation" as a benefit. Name the leverage or the locality.

## Principles

- **Depth belongs to the interface.** A deep module can be built from small parts inside. Callers just don't see them. It can have internal seams for its own tests and one external seam at its interface.
- **The deletion test.** Imagine deleting the module. If complexity disappears, it was a pass-through. If it reappears in every caller, it was earning its keep.
- **The interface is the test surface.** Callers and tests cross the same seam. If a test has to reach past the interface, the module is the wrong shape.
- **One adapter is a hypothetical seam. Two is a real one.** Don't cut a seam until something varies across it. A fake used by the tests counts as the second adapter.

Depth is not lines of implementation divided by lines of interface. That measure rewards padding.

## Dependency categories

Classify a candidate's dependencies. The category decides how the deepened module is tested.

1. **In-process**: pure logic and in-memory state. Merge the modules and test through the new interface. No adapter needed.
2. **Local-substitutable**: dependencies with a real local stand-in. A database the tests run against for real is the usual case. Test the deepened module against it, and keep the seam internal.
3. **Owned but remote**: your own process across a network or queue (a worker behind a job table, say). Put a port at the seam, with the production adapter and an in-memory one for tests.
4. **True external**: third-party APIs and identity providers. The module takes a port, production gets the real adapter, and tests get a fake.

## Testing a deepened module: replace, don't layer

- Write the tests at the new interface. Assert on what a caller can observe.
- Delete the old tests of the shallow modules it absorbed. Keeping them pins the old shape.
- A test that has to change when the implementation changes was testing past the interface.
