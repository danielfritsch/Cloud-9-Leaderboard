"use strict";
/**
 * File that contains method and class that enable displaying
 * user's personal info
 *
 * Contain MenuDataProvider and MenuItem class.
 *
 * @file   This files defines the MyClass class.
 * @author AuthorName.
 */
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
exports.handleMenuChangeSelection = exports.connectCloud9MenuTreeView = exports.MenuItem = exports.MenuDataProvider = void 0;
const vscode_1 = require("vscode");
const Constants_1 = require("./Constants");
const Authentication_1 = require("./Authentication");
const Authentication_2 = require("./Authentication");
const path = require('path');
const resourcePath = path.join(__filename, '..', '..', '..', 'resources');
class MenuDataProvider {
    constructor() {
        this._onDidChangeTreeData = new vscode_1.EventEmitter();
        this.onDidChangeTreeData = this
            ._onDidChangeTreeData.event;
        this.data = [
            new MenuItem('Sign in / Create Account'),
            new MenuItem('📊 View personal stats'),
            new MenuItem('🌐 Leaderboard'),
        ];
    }
    refresh() {
        console.log('Refresh called**************************');
        const ctx = Authentication_2.getExtensionContext();
        if (ctx.globalState.get(Constants_1.GLOBAL_STATE_USER_ID) !== undefined) {
            this.data = [
                new MenuItem(`Welcome, ${ctx.globalState.get(Constants_1.GLOBAL_STATE_USER_NICKNAME)}`),
                new MenuItem('📊 View personal stats'),
                new MenuItem('🌐 Leaderboard'),
            ];
        }
        else {
            console.log("User not logged in");
        }
        this._onDidChangeTreeData.fire(null);
    }
    bindView(menuTreeView) {
        this.view = menuTreeView;
    }
    getChildren(task) {
        if (task === undefined) {
            return this.data;
        }
        return task.children;
    }
    getTreeItem(task) {
        return task;
    }
}
exports.MenuDataProvider = MenuDataProvider;
class MenuItem extends vscode_1.TreeItem {
    constructor(label, children) {
        super(label, children === undefined
            ? vscode_1.TreeItemCollapsibleState.None
            : vscode_1.TreeItemCollapsibleState.Collapsed);
        this.children = children;
    }
}
exports.MenuItem = MenuItem;
exports.connectCloud9MenuTreeView = (view) => {
    return vscode_1.Disposable.from(view.onDidChangeSelection((e) => __awaiter(void 0, void 0, void 0, function* () {
        if (!e.selection || e.selection.length === 0) {
            return;
        }
        const item = e.selection[0];
        exports.handleMenuChangeSelection(view, item);
    })));
};
exports.handleMenuChangeSelection = (view, item) => {
    if (item.label === 'Sign in / Create Account') {
        Authentication_1.signInOrSignUpUserWithUserInput();
    }
    else if (item.label === '📊 View personal stats') {
        vscode_1.commands.executeCommand('cloud9.personalStats');
    }
    else if (item.label === '🌐 Leaderboard') {
        vscode_1.commands.executeCommand('cloud9.leaderboard');
    }
};
//# sourceMappingURL=MenuDataProvider.js.map