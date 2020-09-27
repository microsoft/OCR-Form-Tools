import git 
import re

appVersion = "2.1-preview.1"
gitCommitUrl = "https://github.com/microsoft/OCR-Form-Tools/commit/"

lastChanglogCommit = None
changelogCurrentLineIndex = -1
commitRegex = re.compile("^\s*\#\#\#\s*[\w.-]*-(\w*)\s*\([\d-]*\)")
with open("../CHANGELOG.md", "r") as changelog:
    commitHistoryStarted = False 
    for line in changelog:
        changelogCurrentLineIndex = changelogCurrentLineIndex + 1
        match = commitRegex.search(line)
        if match is not None:
            print("Last changelog commit:")
            print(match.group(1) + "\t" + line)
            print("On changelog line index: " + str(changelogCurrentLineIndex))
            print()
            lastChanglogCommit = match.group(1)
            break

changelog.close()
changelog = open("../CHANGELOG.md", "r")
changelogContents = changelog.readlines()
changelogContents.pop(changelogCurrentLineIndex)
changelog.close()

def insterIntoChanglogContents(message):
    global changelogContents
    global changelogCurrentLineIndex
    changelogContents.insert(changelogCurrentLineIndex, message)
    changelogCurrentLineIndex = changelogCurrentLineIndex + 1

currentCommitDate = None
repo = git.Repo("../")
commits = list(repo.iter_commits("master"))
for commit in commits:
    commitHex = commit.hexsha[:7]
    commitDate = commit.committed_datetime.strftime("%m-%d-%Y")
    if currentCommitDate != commitDate:
        if currentCommitDate is not None:
            insterIntoChanglogContents("\n")
        currentCommitDate = commitDate
        insterIntoChanglogContents("### " + appVersion + "-" + commitHex + " (" + commitDate + ")\n")
    if commitHex == lastChanglogCommit:
        print("found last change log commit")
        break
    commitMessage = commit.message.partition('\n')[0]
    commitMessageRegex = re.compile("(.*)\(\#(\d+)\)\s*$")
    match = commitMessageRegex.search(commitMessage)
    if match is not None:
        insterIntoChanglogContents("* " + match.group(1) + "([#" + match.group(2) + "](" + gitCommitUrl + commit.hexsha + "))" + "\n")
    else:
        insterIntoChanglogContents("* " + commitMessage + "([#??](" + gitCommitUrl + commit.hexsha + "))" + "\n")
    
changelog = open("../CHANGELOG.md", "w")
changelogContents = "".join(changelogContents)
changelog.write(changelogContents)
changelog.close()

