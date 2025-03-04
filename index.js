const path = require('path');
const { getAllFilePathsWithExtension, readFile } = require('./fileSystem');
const { readLine } = require('./console');

const todoRegex = /\/\/\s*todo\s*:?/i;
const dataRegex = /\/\/\s*todo\s+(.+?);\s*(.+?);\s*(.+)/i;

let usedComments = [];

console.log('Please, write your command!');
readLine(processCommand);

function getFiles() {
    const filePaths = getAllFilePathsWithExtension(process.cwd(), 'js');
    return filePaths.map(filePath => ({
        path: filePath,
        content: readFile(filePath)
    }));
}

function getCommentsArray() {
    let commentsArray = [];
    let filesArray = getFiles();
    for (let i = 0; i < filesArray.length; i++) {
        let lines = filesArray[i].content.split('\n');
        for (let j = 0; j < lines.length; j++) {
            let index = lines[j].search(todoRegex);
            if (index !== -1) {
                commentsArray.push({
                    comment: lines[j].substring(index).trim(),
                    fileName: path.basename(filesArray[i].path)
                });
            }
        }
    }
    return commentsArray;
}


function parseDate(dateStr) {
    let workString = typeof dateStr === 'string' ? dateStr : dateStr[0];
    let dateArr = workString.includes('-') ? workString.split('-') : [workString];
    let year = Number(dateArr[0]);
    let month = dateArr.length >= 2 ? Number(dateArr[1]) : 1;
    let day = dateArr.length >= 3 ? Number(dateArr[2]) : 1;
    return new Date(year, month - 1, day);
}

function formatTableRow(importance, user, date, comment, fileName) {
    const importanceStr = importance.padEnd(1);
    const userStr = user.slice(0,10).padEnd(10);
    const dateStr = date.slice(0,10).padEnd(10);
    const commentStr = comment.slice(0,50).padEnd(50);
    const fileNameStr = fileName.slice(0,50).padEnd(50);
    return `  ${importanceStr}  |  ${userStr}  |  ${dateStr}  |  ${commentStr}  |  ${fileNameStr}`;
}

function printTable(comments) {
    console.log(formatTableRow('!', 'User', 'Date', 'Comment', 'File'));
    console.log('-'.repeat(110));
    comments.forEach(({ comment, fileName }) => {
        const importance = comment.includes('!') ? '!' : '';
        const data = comment.match(dataRegex);

        let user = '';
        let date = '';
        let commentText = comment.replace(todoRegex, '').trim();

        if (data) {
            user = data[1].trim();
            date = data[2].trim();
            commentText = data[3].trim();
        }

        console.log(formatTableRow(importance, user, date, commentText, fileName));
    });
}

function printUser(commentsArray, username) {
    const filteredComments = commentsArray.filter(({ comment }) => {
        const data = comment.match(dataRegex);
        if (data) {
            const user = data[1].trim().toLowerCase();
            return user === username.toLowerCase();
        }
        return false;
    });
    printTable(filteredComments);
    usedComments.push(...filteredComments);
}

function printImportant(commentsArray) {
    const filteredComments = commentsArray.filter(({ comment }) =>
        comment.includes('!')
    );
    printTable(filteredComments);
    usedComments.push(...filteredComments);
}

function printRest(commentsArray) {
    const filteredComments = commentsArray.filter(({ comment }) =>
        !usedComments.some(used => used.comment === comment)
    );
    printTable(filteredComments);
}

function printDate(commentsArray, dateStr) {
    const currentDate = parseDate(dateStr);

    const filteredComments = commentsArray.filter(({ comment }) => {
        const data = comment.match(dataRegex);
        if (data) {
            const date = data[2].trim();
            const commentDate = parseDate(date);
            return commentDate > currentDate;
        }
        return false;
    });

    printTable(filteredComments);
    usedComments.push(...filteredComments);
}

function processCommand(command) {
    let commentsArray = getCommentsArray();
    let splitCommand = command.split(' ');

    switch (splitCommand[0]) {
        case 'exit':
            process.exit(0);
            break;
        case 'show':
            printTable(commentsArray);
            break;
        case 'important':
            printImportant(commentsArray);
            break;
        case 'user':
            if (splitCommand.length > 1) {
                printUser(commentsArray, splitCommand[1]);
            } else {
                console.log('Please enter a username.');
            }
            break;
        case 'sort':
            if (splitCommand.length > 1) {
                let subCommand = splitCommand[1];
                if (subCommand === 'important') {
                    printImportant(commentsArray);
                    printRest(commentsArray);
                } else if (subCommand === 'user') {
                    printUser(commentsArray, splitCommand[2]);
                    printRest(commentsArray);
                }
            } else {
                console.log('Please enter sort type.');
            }
            break;
        case 'date':
            if (splitCommand.length > 1) {
                printDate(commentsArray, splitCommand[1]);
            } else {
                console.log('Please enter a date.');
            }
            break;
        default:
            console.log('wrong command');
            break;
    }
}