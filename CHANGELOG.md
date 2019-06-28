# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).


## [Unreleased]


## [0.1.0-rc1] - 2019-06-28

## Removed

- Non-string whitespace option. It was more complicated than it's worth and
this is better handled by minifiers.


## [0.1.0-rc0] - 2019-06-27

## Added

- Now depends on lean-he for full html entity handling

## Fixed

- Finally handles all the html entities
- Whitespace in pre tags was out of whack


## [0.1.0-beta3] - 2019-06-27

### Fixed

- More characters where being transformed to html entities


## [0.1.0-beta2] - 2019-06-26

### Fixed

- blockquote bug also affected raw html inside markdown


## [0.1.0-beta1] - 2019-06-25

### Fixed

- posthtml-parser replaced blockquote markers with html entities


## [0.1.0-beta0] - 2019-06-24

- Initial realease
