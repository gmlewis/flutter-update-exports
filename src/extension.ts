'use strict';
import * as vscode from 'vscode';
const fs = require('fs');
const path = require('path');

const exportRE = /^export\s+['"](.*)['"];$/mg;

// Export represents a single export statement in the current Dart file.
class Export {
    editor: vscode.TextEditor | null;
    exportName: string;
    exportOffset: number;
    exportLine: string;
    dirName: string;

    constructor(editor: vscode.TextEditor | null, exportName: string, exportOffset: number, exportLine: string) {
        this.editor = editor;
        this.exportName = exportName;
        this.exportOffset = exportOffset;
        this.exportLine = exportLine;
        this.dirName = path.dirname(exportName);
    }
}

// Exports represents the exports in a Dart file.
class Exports {
    editor: vscode.TextEditor | null;
    exports: Array<Export>;
    exportDirs: Map<string, number>;
    primaryDir: string;
    primaryDirCount: number;

    constructor(editor: vscode.TextEditor | null, buf: string) {
        this.editor = editor;
        this.exports = new Array<Export>();
        this.exportDirs = new Map<string, number>();
        this.primaryDir = '';
        this.primaryDirCount = 0;
        while (true) {
            let mm = exportRE.exec(buf);
            if (!mm) { break; }
            let exportName = mm[1];
            let exportOffset = buf.indexOf(mm[0]);
            let ex = new Export(editor, exportName, exportOffset, mm[0]);
            exports.push(ex);
            let n = this.exportDirs.get(ex.dirName) || 0;
            n++;
            this.exportDirs.set(ex.dirName, n);
            if (n > this.primaryDirCount) {
                this.primaryDir = ex.dirName;
                this.primaryDirCount = n;
            }
        }
        console.log('Found ' + this.exports.length.toString() + ' export statements.');
        console.log('Primary dir: ' + this.primaryDir);
    }
}

const updateOrCreateFile = (dirName: string, files: Array<string>) => {
    console.log('Processing ' + files.length.toString() + ' exports.');
    let fileName = dirName + '.dart';
    try {
        let buf: string = fs.readfileSync(fileName);
        console.log('Found file: ' + fileName + ', length: ' + buf.length.toString());
        let exports = new Exports(null, buf);
        console.log('exports.primaryDir=' + exports.primaryDir);
    } catch (Exception) {
        console.log('Unable to find file: ' + fileName + '; creating it...');
        let rootName: string = path.basename(dirName);
        let lines = new Array<string>();
        files.forEach((name) => lines.push("export '" + path.join(rootName, name) + "';"));
        lines.sort();
        fs.writeFileSync(fileName, lines.join('\n'));
    }
};

export function activate(context: vscode.ExtensionContext) {
    console.log('Congratulations, "Flutter Update Exports" is now active!');

    let disposable = vscode.commands.registerCommand('extension.flutterUpdateExports', async () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            return; // No open text editor
        }
        let saveSelection = editor.selection;

        let document = editor.document;
        const buf = document.getText();
        let exports = new Exports(editor, buf);

        let fileName: string = document.fileName;
        let dirName: string = path.dirname(fileName);
        let extension: string = path.extname(fileName);
        let rootName: string = path.basename(fileName, extension);
        console.log('Invoked extension on file: ' + rootName);

        let primaryDir = exports.primaryDir;
        if (exports.primaryDirCount < 1) {
            primaryDir = rootName;
        }

        let inTargetMode: boolean = true;
        let files: string[] = [];
        try {
            let subdirName = path.join(dirName, primaryDir);
            files = fs.readdirSync(subdirName);
        } catch (Exception) {
            inTargetMode = false;
            files = fs.readdirSync(dirName);
        }
        console.log('In-target-mode: ' + inTargetMode.toString());
        if (files.length < 1) {
            console.log('No files found. Quiting.');
            return;
        }
        console.log('Files: ' + files.join(', '));

        if (!inTargetMode) {
            updateOrCreateFile(dirName, files);
            return;
        }

        editor.selection = saveSelection;
    });

    context.subscriptions.push(disposable);
}

export function deactivate() {
}
