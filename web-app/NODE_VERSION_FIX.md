# Fixing Node.js Version Issue

You're currently running Node.js v21.7.1, but this project requires Node.js version `^20.19 || ^22.12 || >=24`.

## Quick Fix: Install Xcode Command Line Tools (Required for Homebrew)

First, install the Xcode command line tools:

```bash
xcode-select --install
```

This will open a dialog - click "Install" and wait for it to complete.

## Option 1: Use nvm (Node Version Manager) - Easiest

This is the easiest way to manage Node.js versions without needing Xcode.

### Install nvm:

```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
```

Then restart your terminal or run:
```bash
source ~/.zshrc
```

### Install and use Node.js 22:

```bash
# Install Node.js 22 (LTS)
nvm install 22

# Use Node.js 22
nvm use 22

# Set it as default (optional)
nvm alias default 22

# Verify the version
node --version
```

Then try `npm install` again in the `web-app` directory.

## Option 2: Update Node.js with Homebrew (After installing Xcode tools)

After installing Xcode command line tools:

```bash
# Update Homebrew
brew update

# Install Node.js 22
brew install node@22

# Link it (if needed)
brew link node@22 --force
```

## Option 3: Temporary Workaround (Not Recommended)

If you can't update Node.js right now, you can temporarily bypass the engine check:

```bash
cd web-app
npm install --ignore-engines
```

**Warning**: This may cause runtime issues. It's better to update Node.js.

## Verify Installation

After updating, verify your Node.js version:

```bash
node --version
```

You should see something like `v22.x.x` or `v24.x.x`.

Then try installing dependencies again:

```bash
cd web-app
npm install
```
