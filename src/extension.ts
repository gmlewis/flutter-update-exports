'use strict';
import * as vscode from 'vscode';
const fs = require('fs');
const path = require('path');

const exportRE = /^export\s+.*$/;

export function activate(context: vscode.ExtensionContext) {
    console.log('Congratulations, "Flutter Update Exports" is now active!');

    let disposable = vscode.commands.registerCommand('extension.flutterUpdateExports', async () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            return; // No open text editor
        }
        let saveSelection = editor.selection;

        let fileName: string = editor.document.fileName;
        let dirName: string = path.dirname(fileName);
        let extension: string = path.extname(fileName);
        let rootName: string = path.basename(fileName, extension);
        console.log("Invoked extension on file: " + rootName);

        let inTargetMode: boolean = true;
        let files: string[] = [];
        try {
            files = fs.readdirSync(path.join(dirName, rootName));
        } catch (Exception) {
            inTargetMode = false;
            files = fs.readdirSync(dirName);
        }
        console.log("In-target-mode: " + inTargetMode.toString());
        console.log("Files: " + files.join(', '));

        editor.selection = saveSelection;
    });

    context.subscriptions.push(disposable);
}

export function deactivate() {
}
