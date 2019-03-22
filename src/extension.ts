'use strict';
import * as vscode from 'vscode';
import { Uri } from 'vscode';
const fs = require('fs');
const path = require('path');

const exportRE = /^export\s+['"](.*\.dart)['"];$/mg;

// Export represents a single export statement in the current Dart file.
class Export {
    editor: vscode.TextEditor;
    exportName: string;
    exportOffset: number;
    exportLine: string;
    dirName: string;

    constructor(editor: vscode.TextEditor, exportName: string, exportOffset: number, exportLine: string) {
        this.editor = editor;
        this.exportName = exportName;
        this.exportOffset = exportOffset;
        this.exportLine = exportLine;
        this.dirName = path.dirname(exportName);
    }
}

// Exports represents the exports in a Dart file.
class Exports {
    editor: vscode.TextEditor;
    exportDirs: Map<string, Array<Export>>;
    primaryDir: string;
    primaryDirCount: number;

    constructor(editor: vscode.TextEditor, buf: string) {
        this.editor = editor;
        this.exportDirs = new Map<string, Array<Export>>();
        this.primaryDir = '';
        this.primaryDirCount = 0;
        let total = 0;
        while (true) {
            let mm = exportRE.exec(buf);
            if (!mm) { break; }
            total++;
            let exportName = mm[1];
            let exportOffset = buf.indexOf(mm[0]);
            let ex = new Export(editor, exportName, exportOffset, mm[0]);
            let arr = this.exportDirs.get(ex.dirName) || new Array<Export>();
            arr.push(ex);
            this.exportDirs.set(ex.dirName, arr);
            if (arr.length > this.primaryDirCount) {
                this.primaryDir = ex.dirName;
                this.primaryDirCount = arr.length;
            }
        }
        console.log('Found ' + total + ' export statements.');
        if (this.primaryDirCount > 0) {
            console.log('Primary dir: ' + this.primaryDir);
        }
    }

    async replaceWith(primaryDir: string, files: Array<string>) {
        let lines = exportLines(primaryDir, files);
        let replacement = lines.join('\n') + '\n';
        let exs = this.exportDirs.get(primaryDir) || [];

        if (exs.length < 1) {  // Append exports to end of file.
            const buf = this.editor.document.getText();
            const startPos = this.editor.document.positionAt(buf.length);
            this.editor.selection = new vscode.Selection(startPos, startPos);
            if (buf.length > 0 && !buf.endsWith('\n')) {
                replacement = '\n' + replacement;
            }
            await this.editor.edit((editBuilder: vscode.TextEditorEdit) => {
                editBuilder.replace(this.editor.selection, replacement);
            });
            return;
        }

        for (let i = exs.length - 1; i >= 0; i--) {
            let ex = exs[i];
            const startPos = this.editor.document.positionAt(ex.exportOffset);
            const endIndex = ex.exportOffset + ex.exportLine.length + 1;
            const endPos = this.editor.document.positionAt(endIndex);
            this.editor.selection = new vscode.Selection(startPos, endPos);
            await this.editor.edit((editBuilder: vscode.TextEditorEdit) => {
                editBuilder.replace(this.editor.selection, (i === 0) ? replacement : '');
            });
        }
    }
}

const exportLines = (rootName: string, files: Array<string>) => {
    let lines = new Array<string>();
    files.forEach((name) => lines.push("export '" + path.join(rootName, name) + "';"));
    lines.sort();
    return lines;
};

const updateOrCreateFile = (dirName: string, files: Array<string>) => {
    console.log('Found ' + files.length.toString() + ' .dart files in dir: ' + dirName);
    let rootName: string = path.basename(dirName);
    let parentDir: string = path.dirname(dirName);
    let parent2Dir: string = path.dirname(parentDir);
    let fileName: string = parentDir.endsWith('/src') ? path.join(parent2Dir, rootName + '.dart') : dirName + '.dart';
    console.log('Looking for file: ' + fileName);
    try {
        let buf: string = fs.readFileSync(fileName);
        console.log('Found file: ' + fileName + ', length: ' + buf.length.toString());
        vscode.workspace.openTextDocument(Uri.file(fileName)).then((doc) => {
            vscode.window.showTextDocument(doc);
            const editor = vscode.window.activeTextEditor;
            if (!editor) {
                console.log('vscode unable to open: ' + fileName);
                return;
            }
            let exports = new Exports(editor, buf);
            exports.replaceWith(exports.primaryDir, files);
        });
    } catch (ex) {
        console.log('Exception: ' + ex.toString());
        console.log('Unable to find file: ' + fileName + '; creating it...');
        let lines = exportLines(rootName, files);
        console.log('Writing file: ' + fileName);
        fs.writeFileSync(fileName, lines.join('\n') + '\n');
    }
};

class TargetInfo {
    primaryDir: string;
    inTargetMode: boolean;
    fileNames: Array<string>;

    constructor(dirName: string, primaryDir: string) {
        this.primaryDir = primaryDir;
        this.inTargetMode = true;
        this.fileNames = [];

        try {
            let subdirName = path.join(dirName, primaryDir);
            console.log('Looking for directory: ' + subdirName);
            this.fileNames = fs.readdirSync(subdirName);
        } catch (ex) {
            try {
                let subdirName = path.join(dirName, 'src', primaryDir);
                console.log('Looking for directory: ' + subdirName);
                this.fileNames = fs.readdirSync(subdirName);
                this.primaryDir = path.join('src', primaryDir);
            } catch (ex) {
                this.inTargetMode = false;
                this.fileNames = fs.readdirSync(dirName);
            }
        }
        // Filter out any non-.dart files.
        this.fileNames = this.fileNames.filter((name) => name.endsWith('.dart'));
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

        let targetInfo = new TargetInfo(dirName, primaryDir);
        console.log('In-target-mode: ' + targetInfo.inTargetMode.toString());
        if (targetInfo.fileNames.length < 1) {
            console.log('No files found in child directory. Quiting.');
            return;
        }
        // console.log('Files: ' + files.join(', '));

        if (!targetInfo.inTargetMode) {
            updateOrCreateFile(dirName, targetInfo.fileNames);
            return;
        }
        exports.replaceWith(targetInfo.primaryDir, targetInfo.fileNames);

        editor.selection = saveSelection;
    });

    context.subscriptions.push(disposable);
}

export function deactivate() {
}
