# Copilot Commit Message Instructions

## Commit Message Format

```
<type>(<project> - <scope>): <subject>
<BLANK LINE>
<body>
<BLANK LINE>
<footer>
```

### Type

The type of commit message. It can be one of the following:

- **feat**: A new feature
- **fix**: A bug fix
- **docs**: Documentation only changes
- **style**: Changes that do not affect the meaning of the code (white-space, formatting, missing semi-colons, etc)
- **refactor**: A code change that neither fixes a bug nor adds a feature
- **perf**: A code change that improves performance
- **test**: Adding missing tests
- **chore**: Changes to the build process or auxiliary tools and libraries such as documentation generation

### Project Scope

The project scope can be one of the following:

- **core**: Core functionality
- **web**: Web application
- **backend**: Backend application

### Scope

The scope of the commit message. It can be anything specifying the place of the commit change.

### Subject 

The subject contains succinct description of the change:

- Use the imperative, present tense: "change" not "changed" nor "changes"
- Don't capitalize first letter
- No dot (.) at the end