'use strict';
import * as vscode from 'vscode';
const fs = require('fs');
const path = require('path');

const exportRE = /^export\s+['"](.*)['"];$/mg;

// Export represents a single export statement in the current Dart file.
class Export {
    editor: vscode.TextEditor;
    exportName: string;
    exportOffset: number;
    exportLine: string;
    dirName: string

    constructor(editor: vscode.TextEditor, exportName: string, exportOffset: number, exportLine: string) {
        this.editor = editor;
        this.exportName = exportName;
        this.exportOffset = exportOffset;
        this.exportLine = exportLine;
        this.dirName = path.dirname(exportName);
    }
}

export function activate(context: vscode.ExtensionContext) {
    console.log('Congratulations, "Flutter Update Exports" is now active!');

    let disposable = vscode.commands.registerCommand('extension.flutterUpdateExports', async () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            return; // No open text editor
        }
        let saveSelection = editor.selection;

        let document = editor.document;
        let exports = new Array<Export>();
        let exportDirs = new Map<string, number>();
        let primaryDir = '';
        let primaryDirCount = 0;
        const buf = document.getText();
        while (true) {
            let mm = exportRE.exec(buf);
            if (!mm) { break; }
            let exportName = mm[1];
            let exportOffset = buf.indexOf(mm[0]);
            let ex = new Export(editor, exportName, exportOffset, mm[0]);
            exports.push(ex);
            let n = exportDirs.get(ex.dirName) || 0;
            n++;
            exportDirs.set(ex.dirName, n);
            if (n > primaryDirCount) {
                primaryDir = ex.dirName;
                primaryDirCount = n;
            }
        }

        let fileName: string = document.fileName;
        let dirName: string = path.dirname(fileName);
        let extension: string = path.extname(fileName);
        let rootName: string = path.basename(fileName, extension);
        console.log('Invoked extension on file: ' + rootName);
        console.log('Found ' + exports.length.toString() + ' export statements.');
        if (primaryDirCount > 0) {
            console.log('Primary dir: ' + primaryDir);
        }

        let inTargetMode: boolean = true;
        let files: string[] = [];
        try {
            files = fs.readdirSync(path.join(dirName, rootName));
        } catch (Exception) {
            inTargetMode = false;
            files = fs.readdirSync(dirName);
        }
        console.log('In-target-mode: ' + inTargetMode.toString());
        console.log('Files: ' + files.join(', '));

        editor.selection = saveSelection;
    });

    context.subscriptions.push(disposable);
}

export function deactivate() {
}
