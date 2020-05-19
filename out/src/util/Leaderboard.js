"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.displayTeamLeaderboard = exports.displayLeaderboard = exports.getTeamLeaderboardFile = exports.getLeaderboardFile = exports.Leaderboard = void 0;
const vscode_1 = require("vscode");
const Util_1 = require("../../lib/Util");
const Firestore_1 = require("./Firestore");
const Authentication_1 = require("./Authentication");
const Constants_1 = require("./Constants");
const fs = require('fs');
class Leaderboard {
    constructor() { }
    static addUser(userId, userObj) {
        if (!Leaderboard.users) {
            Leaderboard.users = [];
        }
        let user = new Object();
        user['id'] = userId;
        for (let key in userObj) {
            user[key] = userObj;
        }
        Leaderboard.users.push(user);
    }
    static getUsers() {
        return Leaderboard.users;
    }
}
exports.Leaderboard = Leaderboard;
function getLeaderboardFile() {
    let filePath = Util_1.getSoftwareDir();
    if (Util_1.isWindows()) {
        filePath += '\\leaderboard.txt';
    }
    else {
        filePath += '/leaderboard.txt';
    }
    return filePath;
}
exports.getLeaderboardFile = getLeaderboardFile;
function getTeamLeaderboardFile() {
    let filePath = Util_1.getSoftwareDir();
    if (Util_1.isWindows()) {
        filePath += '\\team_leaderboard.txt';
    }
    else {
        filePath += '/team_leaderboard.txt';
    }
    return filePath;
}
exports.getTeamLeaderboardFile = getTeamLeaderboardFile;
function displayLeaderboard() {
    return __awaiter(this, void 0, void 0, function* () {
        // 1st write the code time metrics dashboard file
        // await writeLeaderboard();
        yield Firestore_1.retrieveAllUserStats(writeToFile);
        let filePath = getLeaderboardFile();
        vscode_1.workspace.openTextDocument(filePath).then((doc) => {
            // only focus if it's not already open
            vscode_1.window.showTextDocument(doc, vscode_1.ViewColumn.One, false).then((e) => {
                // done
            });
        });
    });
}
exports.displayLeaderboard = displayLeaderboard;
function displayTeamLeaderboard() {
    return __awaiter(this, void 0, void 0, function* () {
        // 1st write the code time metrics dashboard file
        // await writeLeaderboard();
        yield Firestore_1.retrieveTeamMemberStats(writeToFile);
        let filePath = getTeamLeaderboardFile();
        vscode_1.workspace.openTextDocument(filePath).then((doc) => {
            // only focus if it's not already open
            vscode_1.window.showTextDocument(doc, vscode_1.ViewColumn.One, false).then((e) => {
                // done
            });
        });
    });
}
exports.displayTeamLeaderboard = displayTeamLeaderboard;
function writeToFile(users, isTeam) {
    return __awaiter(this, void 0, void 0, function* () {
        let leaderboardFile;
        if (isTeam) {
            leaderboardFile = getTeamLeaderboardFile();
        }
        else {
            leaderboardFile = getLeaderboardFile();
        }
        const ctx = Authentication_1.getExtensionContext();
        let cachedUserId = ctx.globalState.get(Constants_1.GLOBAL_STATE_USER_ID);
        let leaderBoardContent = '';
        if (isTeam) {
            leaderBoardContent += 'LEADERBOARD \t (Private)\n\n';
        }
        else {
            leaderBoardContent += 'LEADERBOARD \t (Global)\n\n';
        }
        let scoreMap = [];
        users.map((user) => {
            let obj = {};
            obj['id'] = user.id;
            obj['name'] = user['name'];
            obj['score'] = parseFloat(user['cumulativePoints']).toFixed(3);
            scoreMap.push(obj);
        });
        scoreMap.sort(function (a, b) {
            return b.score - a.score;
        });
        let rankSection = '';
        let username = '';
        scoreMap.map((user, i) => {
            if (i == 0) {
                rankSection += '\uD83E\uDD47 ';
            }
            else if (i == 1) {
                rankSection += '\uD83E\uDD48 ';
            }
            else if (i == 2) {
                rankSection += '\uD83E\uDD49 ';
            }
            else {
                rankSection += '   ';
            }
            if (cachedUserId == user.id) {
                username = user.name;
                rankSection +=
                    i + 1 + '\t\t' + user.name + ' (YOU) \t\t' + user.score + '\n';
            }
            else {
                rankSection += i + 1 + '\t\t' + user.name + '\t\t' + user.score + '\n';
            }
        });
        leaderBoardContent += 'Username \t : \t ' + username + '\n';
        leaderBoardContent += 'Teamname \t : \t ' + '______' + '\n\n';
        leaderBoardContent +=
            '============================================================\n';
        leaderBoardContent += 'LEADERBOARD RANKING \n';
        leaderBoardContent +=
            '============================================================\n\n';
        leaderBoardContent += 'RANK     NAME                         SCORE\n';
        leaderBoardContent += '----     ----                         -----\n';
        leaderBoardContent += rankSection + '\n';
        leaderBoardContent +=
            '============================================================\n';
        leaderBoardContent += 'Metric \n';
        leaderBoardContent +=
            '============================================================\n\n';
        console.log(scoreMap);
        leaderBoardContent += 'Each second spent coding        + 0.01 \n';
        leaderBoardContent += 'Each keystroke                  +    1 \n';
        leaderBoardContent += 'Each modified line              +   10 \n';
        fs.writeFileSync(leaderboardFile, leaderBoardContent, (err) => {
            if (err) {
                console.error('Error writing leaderboard');
            }
        });
    });
}
//# sourceMappingURL=Leaderboard.js.map