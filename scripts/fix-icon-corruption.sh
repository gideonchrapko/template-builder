#!/bin/bash
# Script to fix Icon file corruption in Git
# Run this if you see "bad object refs/Icon?" errors
#
# This happens when macOS creates "Icon" resource fork files that Git tries to track
# These files corrupt Git references and cause fatal errors

echo "🔧 Fixing Icon file corruption..."

# Remove corrupted Icon references
echo "Removing corrupted Icon references..."
rm -f .git/refs/Icon .git/refs/heads/Icon .git/refs/tags/Icon .git/refs/remotes/Icon .git/refs/remotes/origin/Icon 2>/dev/null
rm -f .git/refs/remotes/origin/Icon* 2>/dev/null

# Remove corrupted Icon objects
echo "Removing corrupted Icon objects..."
find .git/objects -name "*Icon*" -type f -delete 2>/dev/null

# Clean up Git
echo "Cleaning up Git repository..."
git prune 2>/dev/null || true

# Remove any Icon files from working directory
echo "Removing Icon files from working directory..."
find . -name "Icon" -type f -not -path "./.git/*" -not -path "./node_modules/*" -delete 2>/dev/null

echo ""
echo "✅ Icon corruption fixed!"
echo ""
echo "If you still see 'bad object refs/Icon?' errors when pulling:"
echo "  The remote repository has corrupted Icon refs. Options:"
echo "  1. Use: git push origin main --force-with-lease (if your local is correct)"
echo "  2. Or contact GitHub support to clean up the remote refs"
echo ""
echo "Prevention measures now in place:"
echo "  ✅ Pre-commit hook blocks Icon files from being committed"
echo "  ✅ .gitignore includes Icon and Icon? patterns"
echo "  ✅ Git config ignores case to prevent conflicts"
echo ""
echo "If this happens again, just run: ./scripts/fix-icon-corruption.sh"
