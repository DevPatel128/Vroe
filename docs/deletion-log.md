# Subscriber deletion log

An audit trail for `SUBSCRIBERS` KV deletions honouring a data-deletion
request. There's no admin endpoint (see [06-deployment.md](06-deployment.md)),
so these run by hand from a developer machine — this file is what makes that
accountable.

Append a row every time you run `wrangler kv key delete` against
`SUBSCRIBERS`. Never record the email address itself, only the hash that was
already in the key.

| Date | Key deleted (`sub:<sha256>`) | Requested via |
| --- | --- | --- |
