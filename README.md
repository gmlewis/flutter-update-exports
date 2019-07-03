# flutter-update-exports README

Flutter Update Exports is a VSCode extension that simplifies keeping
export statements up-to-date.

## Motivation

In Flutter development, it is a common practice to develop a library
or collection of `*.dart` files in a subdirectory and then export
them all in a single `.dart` file with the same name as the subdir.

For example, this is a common layout:

```
api/*.dart
blocs/*.dart
collections/*.dart
models/*.dart
services/*.dart
widgets/*.dart
api.dart
blocs.dart
collections.dart
models.dart
services.dart
widgets.dart
```

It is also common to see this same hierarchy, but separated by a
`src` directory in between:

```
src/api/*.dart
src/blocs/*.dart
src/collections/*.dart
src/models/*.dart
src/services/*.dart
src/widgets/*.dart
api.dart
blocs.dart
collections.dart
models.dart
services.dart
widgets.dart
```

These top-level `.dart` files simply contain exports of all the subdir
files to make it much easier to import a single file and get all the
contents of the subdirectories.

But keeping these top-level files in sync while "in the zone" like in
the middle of a large refactor is a pain and a major distraction.

The motivation for this VSCode extension is to make it easy to quickly
update these export files to reduce the pain and distraction.

## Features

Flutter Update Exports has two modes depending on which `*.dart` file
it is run on.

The first mode is called "In-target mode." In this mode, the extension
attempts to modify the file it is run on.

The second mode is called "In-child-dir mode." In this mode, the extension
attempts to modify a single file in the current file's parent directory.

How it determines which mode it is in depends on the name of the current
file, its contents, and the names of the directories in the file's current
directory.

## In-target mode

If the current `*.dart` file already contains `export` statements, the
extension attempts to find the primary directory being exported. It then
removes all the `export` statements pointing to that directory and replaces
them with a list of all the `*.dart` files in that directory, in sorted
filename order.

Alternatively, if the current `*.dart` file contains no `export` statements
but the base name of the current `*.dart` file matches the full name of a
directory in the current directory, the extension will append export
statements for every `*.dart` file in the subdirectory.

For example, if "Flutter Update Exports" is invoked on a file called
`api.dart` (either with no `export` statements or with `export` statements
primarily pointing to `api/*.dart` files) and there exists a subdirectory
called `api`, then the extension will attempt to update `api.dart` by
removing all `export 'api/*.dart';` lines and replacing them with a new
`export` line for every `api/*.dart` file found (sorted by filename)

## In-child-dir mode

If the extension is not in "In-target mode", it defaults to "In-child-dir
mode." In this mode, a new file in the parent directory will be edited
or created with `.dart` added as a suffix to the current directory base
name.

As a special case, if the name of the parent directory itself is within
a `src/` directory, the new file will be created one directory higher,
in the same directory as the `src` dir.

For example, if "Flutter Update Exports" is invoked on a file called
`lib/api/api_client.dart` (and no directory `lib/api/api_client` exists),
then the extension will attempt to edit or create the file `api.dart` in
the parent directory and will remove all `export` lines and replace
them with a new `export` line for every `lib/api/*.dart` file found.

For the special case example, if "Flutter Update Exports" is invoked on
a file called `lib/src/api/api_client.dart` (and no directory
`lib/src/api/api_client` exists), then the extension will attempt to edit
or create the file `api.dart` in `lib/src` and will remove all `export`
lines and replace them with a new `export` line for every
`lib/src/api/*.dart` file found.

## Reporting Problems

It is my goal to be able to use this plugin on large group projects, so
every attempt has been made to make this robust. If, however, problems
are found, please raise issues on the [GitHub issue tracker] for this repo
along with a (short) example demonstrating the "before" and "after" results
of running this plugin on the example code.

Even better, please submit a PR with your new "before"/"after" example coded-up
as a unit test along with the code to fix the problem, and I'll try to
incorporate the fix into the plugin.

***Please remember to state which version of the plugin you are using!***

[GitHub issue tracker]: https://github.com/gmlewis/flutter-update-exports/issues

## Known Issues

* None.

## Release Notes

### 0.0.2

- Incorporate vulnerability fix #1.

### 0.0.1

- Initial release, "Flutter Update Exports" is the provided command.

----------------------------------------------------------------------

**Enjoy!**

----------------------------------------------------------------------

# License

Copyright 2019 Glenn M. Lewis. All Rights Reserved.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
