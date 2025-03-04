const { getAllFilePathsWithExtension, readFile } = require('./fileSystem');
const { readLine } = require('./console');
const todoRegex = /\/\/\s*todo\s*:?/i;
const dataRegex = /\/\/\s*todo\s+(.+?);\s*(.+?);\s*(.+)/i;

let usedComments = [];

console.log('Please, write your command!');
readLine(processCommand);

function getFiles() {
    const filePaths = getAllFilePathsWithExtension(process.cwd(), 'js');
    return filePaths.map(path => readFile(path));
}

function getCommentsArray() {
    let commentsArray = [];
    let filesArray = getFiles();
    for (let i = 0; i < filesArray.length; i++) {
        let lines = filesArray[i].split('\n');
        for (let j = 0; j < lines.length; j++) {
            let index = lines[j].search(todoRegex);
            if (index !== -1)
                commentsArray.push(lines[j].substring(index).trim());
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
    return [ year, month, day ];
}

function formatTableRow(importance, user, date, comment) {
    const importanceStr = importance ? '!' : ' ';
    const userStr = user.slice(0, user.length).padEnd(10);
    const dateStr = date.slice(0, date.length).padEnd(10);
    const commentStr = comment.slice(0, comment.length).padEnd(50);
    return `  ${importanceStr}  |  ${userStr}  |  ${dateStr}  |  ${commentStr}`;
}

function printTable(comments) {
    console.log(formatTableRow('!', 'User', 'Date', 'Comment'));
    console.log('-'.repeat(80));
    comments.forEach(comment => {
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

        console.log(formatTableRow(importance, user, date, commentText));
    });
}

function printUser(commentsArray, username) {
    const filteredComments = commentsArray.filter(comment => {
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
    const filteredComments = commentsArray.filter(comment =>
        comment.includes('!')
    );
    printTable(filteredComments);
    usedComments.push(...filteredComments);
}

function printRest(commentsArray) {
    const filteredComments = commentsArray.filter(comment =>
        !usedComments.includes(comment)
    );
    printTable(filteredComments);
}

function printDate(commentsArray, dateStr) {
    let arr = parseDate(dateStr);
    let year = arr[0];
    let month = arr[1];
    let day = arr[2];
    let currentDate = new Date(year, month, day);

    const filteredComments = commentsArray.filter(comment => {
        const data = comment.match(dataRegex);
        if (data) {
            const date = data[2].trim();
            let arr = parseDate(date);
            let year = arr[0];
            let month = arr[1];
            let day = arr[2];
            let comparisonDate = new Date(year, month, day);
            return comparisonDate > currentDate;
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