# QuickStack

QuickStack deploys applications from container images or Git repositories into a managed cluster.

## Language

**App**:
A deployable workload managed by QuickStack.

**Source**:
The origin QuickStack uses to build or run an **App**.

**Configured Source**:
A **Source** with all required connection details selected and ready to be saved or deployed.
_Avoid_: connected source, selected source when referring to readiness

**Git HTTPS Source**:
A Git repository accessed through an HTTPS clone URL, optionally with username and token credentials.
_Avoid_: git https, HTTPS repo

**Git SSH Source**:
A Git repository accessed through an SSH clone URL using an app-specific deploy key.
_Avoid_: SSH repo

**Container Image Source**:
A container image reference QuickStack uses to run an **App** without building from Git.
_Avoid_: Docker Container when referring to the domain concept

**Deploy Key**:
A public SSH key registered with a Git provider to grant repository access to a **Git SSH Source**.
_Avoid_: SSH key when specifically referring to the provider-side access grant

**Git Branch**:
The named Git ref selected as the source revision stream for an **App**.
_Avoid_: branch name when referring to the selected source branch

**App Node Port**:
A direct node-level exposure that maps a cluster node port to one container port and protocol on an 

## Relationships

- An **App** can have zero or one **Configured Source**.
- An **App** can have zero or more **App Node Ports**.
- A **Configured Source** belongs to exactly one **App**.
- Only application workloads can use a **Git HTTPS Source** or **Git SSH Source**.
- A **Git HTTPS Source** belongs to exactly one **App**.
- A **Git SSH Source** belongs to exactly one **App**.
- A **Container Image Source** belongs to exactly one **App**.
- A **Git Source** has exactly one selected **Git Branch** before it can be saved.
- A **Git SSH Source** requires a **Deploy Key** before QuickStack offers **Git Branch** selection.
- An **App Node Port** belongs to exactly one **App** and exposes exactly one container port/protocol.

## Example Dialogue

> **Dev:** "When the user edits a **Git HTTPS Source**, should choosing a **Git Branch** save the **App**?"
> **Domain expert:** "No, selecting the **Git Branch** only updates the current form; the **App** is saved when the user clicks Save."

> **Dev:** "Can QuickStack list branches for a **Git SSH Source** before the provider knows its **Deploy Key**?"
> **Domain expert:** "No, the user must generate the key and register it as a **Deploy Key** with the Git provider before branch selection is shown."

> **Dev:** "Can a user type a **Git Branch** manually when QuickStack cannot load branches?"
> **Domain expert:** "No, the **Git Branch** must be selected from the branches QuickStack loads from the configured Git source."

> **Dev:** "Should QuickStack generate a new **Deploy Key** every time a user edits the Git SSH URL?"
> **Domain expert:** "No, QuickStack reuses the app's existing key unless the user explicitly regenerates it."

> **Dev:** "Should the Source card show Git HTTPS as selected just because it is the database default?"
> **Domain expert:** "No, the card shows an empty connect state until the **App** has a **Configured Source**."

> **Dev:** "What should happen when the user saves a **Configured Source** and deploys immediately?"
> **Domain expert:** "QuickStack saves the **Configured Source**, starts deployment, closes the source dialog, and shows deployment progress in the Overview tab."

> **Dev:** "If an **App** uses an **App Node Port**, should a restrictive ingress policy still block that node-level traffic?"
> **Domain expert:** "No — creating the **App Node Port** is the explicit decision to expose that one container port/protocol through the cluster node."

## Flagged Ambiguities

- "connect to a git https" means configuring a **Git HTTPS Source** for an **App**.
- "no app source chosen" means the **App** has no **Configured Source**, even if storage contains a default source type.
- "Docker Container Image" is the UI label for a **Container Image Source**.
- "branch" means the selected **Git Branch**, not a build branch or deployment branch.
- "node portforwarding" means an **App Node Port**, not an ad hoc developer port-forward session.
