# IDEA-0003 — League: write protection through a signature

> **Status:** rough. Belongs to the custom league ([IDEA-0001](IDEA-0001-custom-league.md)),
> for a later stage. The first version relies on the sharing rights of the storage
> (only the organizer writes).

## Idea

When creating the league the organizer sets a master password. It protects a signing
key so that players can only read the league data and manipulations are noticed.

## Flow

- **Creating:** The app generates a key pair (ECDSA, built into the browser). The
  public key lies in the league data. The private key lies there only encrypted, with
  a key derived from the password (PBKDF2 with salt, AES-GCM).
- **Writing:** The password unlocks the private key, the app signs the league data.
- **Reading:** Every reader checks the signature with the public key and rejects
  modified data, even if somebody wrote in the storage.
- The organizer can pass the password on to co-organizers.

## Why not just a password hash

A hash next to the data protects nothing: whoever can write also changes the hash, and
the check runs only in the respective user's browser. In addition every reader can
guess the hash offline. The signature checks the data itself.

## Limits

- **Deleting and replaying:** Whoever can write can delete files or replace them with
  an older, validly signed version. A version number in the signature partly detects
  that; a backup remains necessary.
- **Confidentiality:** The signature protects integrity, not the content. Names in the
  league data are seen by everybody with read permission.
- **Forgotten password:** no recovery; the league would need a new key. The app has to
  say that clearly when creating it.
- One password for all writers cannot be revoked individually.

## To clarify

- An ADR of its own before the league data gets a format with a signature.
- How the data format of the first version already provides a signature field so that
  no break occurs later.
