# FoTT Changelog
## What's new in Form Recognizer?
Click [here](https://docs.microsoft.com/en-us/azure/cognitive-services/form-recognizer/whats-new) to see what's new in Form Recognizer.

## Released conatiner's currently referenced commit
2.1-Preview's released container image, tracked by the `latest-preview` image tag in our [docker hub repository](https://hub.docker.com/_/microsoft-azure-cognitive-services-custom-form-labeltool), currently references **2.1-preview.1-1f33130 (10-09-2020)**

## Commit history
### 2.1-preview.2-b6b9a2f (12-10-2020)
* update appVersion to 2.1.2 ([#808](https://github.com/microsoft/OCR-Form-Tools/commit/b6b9a2f131485d08541a1e85f6af59ebfbeca773))
* add locale in prebuiltPredictPage ([#772](https://github.com/microsoft/OCR-Form-Tools/commit/06d9c16a7c1fe64a95d835878dcb8dabb8c7e485)) ([#776](https://github.com/microsoft/OCR-Form-Tools/commit/06d9c16a7c1fe64a95d835878dcb8dabb8c7e485))
* Stew ro/cherry pick 347e21e 2b6ead7 ([#766](https://github.com/microsoft/OCR-Form-Tools/commit/ca59cee26587e1aee49507abd75c0683d67f541f))
* Cherry pick 34ce14d a7ccb34 ([#763](https://github.com/microsoft/OCR-Form-Tools/commit/244c23df700791794990eb6f7e196bcf9ff9c844))
* Stew ro/cherry pick ab5a8a8 abfffbb ([#760](https://github.com/microsoft/OCR-Form-Tools/commit/93b7a2d4d7688cda4baa4cfd704b2666df524174))
* refactor: disable api version selection ([#755](https://github.com/microsoft/OCR-Form-Tools/commit/be1f18db0b7073dad106f443f343aa221dea7fc6))
* refactor: disable draw region button ([#756](https://github.com/microsoft/OCR-Form-Tools/commit/8816a85761a795f3f0b34b87360236cadd80a735))
* feat: support null text values in analyze results ([#744](https://github.com/microsoft/OCR-Form-Tools/commit/0ddb7f1275d6f195c2af9f0b7053987e01a5d677))
* feat: support rowspan and column span for layout tables ([#754](https://github.com/microsoft/OCR-Form-Tools/commit/6994ac929146e25370d1461e4e502773de3d5503))
* Update changelog ([#750](https://github.com/microsoft/OCR-Form-Tools/commit/acba3966ce960e474dfd3d97510b07c108e7b39f))
* check whether the label data is null ([#753](https://github.com/microsoft/OCR-Form-Tools/commit/f6ef41ac1500e52f3714eda6e99187e016e1b223))
* fix issue of 773 ([#740](https://github.com/microsoft/OCR-Form-Tools/commit/9d35e79393cdb0de678e9ec6b850daf5a4df5c96))

### 2.1-preview.1-2e50498 (11-09-2020)
* fix: enable api version selection ([#736](https://github.com/microsoft/OCR-Form-Tools/commit/2e5049883bd1550ba80210edca7db4233d7a15fa))
* fix: labeling doesn't work via shortcuts on the new project or empty tags ([#677](https://github.com/microsoft/OCR-Form-Tools/commit/f11291940b776ceb8ba7708e6f58dc2572f7b01b))
* fix: remove setting project state in project form on change ([#732](https://github.com/microsoft/OCR-Form-Tools/commit/25eb59bfa85b755cd877b02ffda71d0cec70a106))
* handle training state logical ([#731](https://github.com/microsoft/OCR-Form-Tools/commit/569adf161ad89106ab1fbf51429841c5955e0e4b))
* fix issue of "After running Layout an all documents FoTT sometimes does not ends" ([#723](https://github.com/microsoft/OCR-Form-Tools/commit/6203e2cd814c95e2bef165f3fb518a566166c26d))
* set includeTextDetails=true in prebuilt predict ([#722](https://github.com/microsoft/OCR-Form-Tools/commit/ba04cebb63a5b05a369ba954a99dfdc7c9bb9b41))
* fix issue of "Auto-labeling while switching assets in asset preview causes an error" ([#721](https://github.com/microsoft/OCR-Form-Tools/commit/59fe4e2778a644335da9766fd1382d56086220c1))
* feat: support api version config ([#717](https://github.com/microsoft/OCR-Form-Tools/commit/c81b2323aaa2b26b0bc0f7922de1e12445fbb627))
* update homepage style ([#724](https://github.com/microsoft/OCR-Form-Tools/commit/fc769f41c169083098f9250c9ce18ca4881cc336))
* issuefix: update getBoundingBox ([#730](https://github.com/microsoft/OCR-Form-Tools/commit/f0cb5db337364b2f0355928616d1f7d9637a454a))
* clone with lodash cloneDeep ([#728](https://github.com/microsoft/OCR-Form-Tools/commit/d6bca5fcf2262a467ede781916a01f50d805b30f))
* remain auto label state while no label data ([#727](https://github.com/microsoft/OCR-Form-Tools/commit/a79d556a3935e387b0798ecfda8de9c8b1538250))
* deep copy asset metadata ([#725](https://github.com/microsoft/OCR-Form-Tools/commit/ba8c1100e9adf517e35ec50fd513383d9e84d630))
* Yongbing chen/receipt predicting ([#626](https://github.com/microsoft/OCR-Form-Tools/commit/e638cd8e3be8926e966a5afc86fb53ac0f092977))

### 2.1-preview.1-32cfaea (11-06-2020)
* Starain chen/clean autolabel data while training ([#712](https://github.com/microsoft/OCR-Form-Tools/commit/32cfaea023e96c8aa00560a3f30134683ee25757))
* fix issue of deleting tag ([#703](https://github.com/microsoft/OCR-Form-Tools/commit/282d55700ea9fdf4cac2b0f20901e8ff6115819e))

### 2.1-preview.1-c7ed086 (11-04-2020)
* Update README.md([#??](https://github.com/microsoft/OCR-Form-Tools/commit/c7ed08612876af8bb619a080f6740fceabb4e67c))
* Update README.md([#??](https://github.com/microsoft/OCR-Form-Tools/commit/d696b8a25438590fb44c5159b3142b17178f25d2))
* fix: use constant if no api version specified ([#684](https://github.com/microsoft/OCR-Form-Tools/commit/8ccdab83f079d976f6521bc08c50d917900483c0))
* auto labeled tag design & replacing between text with draw region ([#670](https://github.com/microsoft/OCR-Form-Tools/commit/757e0dd85b3c69c6642674e48e9d3549807fecbd))

### 2.1-preview.1-aab6938 (11-03-2020)
* Fix the issue that git-commit-info.txt could be override ([#683](https://github.com/microsoft/OCR-Form-Tools/commit/aab69380a8e1f7f113011a7c6b6ed406c4329555))
* fix: use existing git hash when not in git repository ([#682](https://github.com/microsoft/OCR-Form-Tools/commit/586fbb0ce51c27ae42ca857a372e8e8d5dea21d1))
* Stew ro/use api version selected in project settings ([#678](https://github.com/microsoft/OCR-Form-Tools/commit/bed69a3f64b0da7590ca3c54e8de369844c6bcd9))
* refactor: change drawn region icon ([#675](https://github.com/microsoft/OCR-Form-Tools/commit/5614da2681bb8fadf9d3db3ff95aa62362d00175))

### 2.1-preview.1-3485d33 (10-30-2020)
* feat: add bmp support for analyze page ([#672](https://github.com/microsoft/OCR-Form-Tools/commit/3485d33eca96321cf667c5c8eba22cc60af42e23))
* Alex krasn/bugfix on hotkeys when canvas not loaded yet ([#664](https://github.com/microsoft/OCR-Form-Tools/commit/b0404c6276f8fe55292c929e2ca431ed31ef6442))

### 2.1-preview.1-7166cda (10-29-2020)
* fix: use node to update status bar with latest git commit ([#671](https://github.com/microsoft/OCR-Form-Tools/commit/7166cdae5763a93feee52842af8e2246fedbf818))
* change OCR to Layout in UI (Actions) ([#666](https://github.com/microsoft/OCR-Form-Tools/commit/ac604b6bd43eb4c3ba8929a97b308c833d0e6c13))
* Yongbing chen/hitl update notify message ([#651](https://github.com/microsoft/OCR-Form-Tools/commit/0fa559a4b28c6648eaa17ec047ebb9caabbdc9c7))

### 2.1-preview.1-6d775ae (10-27-2020)
* Yongbing chen/ui adjustment with designers feedback ([#662](https://github.com/microsoft/OCR-Form-Tools/commit/6d775ae8d4495ca31d110e500b86d3c0eed6a954))

### 2.1-preview.1-c86b6de (10-23-2020)
* Fix the issue that git-commit-info.txt could be override ([#668](https://github.com/microsoft/OCR-Form-Tools/commit/c86b6de35ecd5d004dfb64f8f857d06f0557a00d))
* Xinxl/fix hash ([#667](https://github.com/microsoft/OCR-Form-Tools/commit/cb27cbd74ff890dc7e13865d89ca5e16b0807fbb))

### 2.1-preview.1-0aae169 (10-22-2020)
* Alex krasn/fix confidence level bar styles ([#657](https://github.com/microsoft/OCR-Form-Tools/commit/0aae1690351f3de27114e6cbebd2c077be8e9016))

### 2.1-preview.1-d644459 (10-21-2020)
* refactor: change error styling and wording for project sharing ([#653](https://github.com/microsoft/OCR-Form-Tools/commit/d644459e4c9b1f82b1ed2d5b537960b0f16184da))
* fix: sort models after loading next page in model compose ([#659](https://github.com/microsoft/OCR-Form-Tools/commit/9818d6301ef613155951381598f9ad4cf8ff6e3c))
* Alex krasn/serialize javascript vulnerability ([#612](https://github.com/microsoft/OCR-Form-Tools/commit/66b03303b1325634371ebdb3923acaa6722be89f))
* update asset labelingState when load local project ([#660](https://github.com/microsoft/OCR-Form-Tools/commit/1aa3daaeeb1c8a4773e7b6236fc6462335e410f9))

### 2.1-preview.1-28c54fc (10-20-2020)
* fix: check for local connections ([#654](https://github.com/microsoft/OCR-Form-Tools/commit/28c54fcc31defe1c4ebcf685675768b99c8e00c8))
* get last commit hash code in current branch and show on status bar ([#642](https://github.com/microsoft/OCR-Form-Tools/commit/88c547995d31f945177da70141f997e441b3259c))
* new feature: tags in current page ([#640](https://github.com/microsoft/OCR-Form-Tools/commit/af5396fe8e63b88b90d16953e17ce2006afe782e))

### 2.1-preview.1-6c1ee2b (10-16-2020)
* adjust editor view offset ([#646](https://github.com/microsoft/OCR-Form-Tools/commit/6c1ee2b6b4f1bcf28b1c9081b21f0a8783518c80))

### 2.1-preview.1-b92e4b3 (10-15-2020)
* reword asset states ([#644](https://github.com/microsoft/OCR-Form-Tools/commit/b92e4b3d5a786a852c319c05697eea331c147cee))

### 2.1-preview.1-4544e52 (10-14-2020)
* feat: support apiVersion selection from project settings ([#641](https://github.com/microsoft/OCR-Form-Tools/commit/4544e5255cf2356a4ddf353f7a63994c1a0865da))

### 2.1-preview.1-94f12bb (10-13-2020)
* new feature: highlight current tag ([#628](https://github.com/microsoft/OCR-Form-Tools/commit/94f12bb4e925a86fdfba8e25d8b0346169daea1e))
* new feature: human in the loop auto labeling ([#571](https://github.com/microsoft/OCR-Form-Tools/commit/c1f227daa3decd52320f58d151755b206280cedd))

### 2.1-preview.1-7d1f871 (10-10-2020)
* Update CHANGELOG.md([#??](https://github.com/microsoft/OCR-Form-Tools/commit/7d1f87193b3917f2140ab9bcce04c64e7aceb823))

### 2.1-preview.1-1f33130 (10-09-2020)
* fix: support image map interactions for container releases([#639](https://github.com/microsoft/OCR-Form-Tools/commit/e015973aee152b8a8b22fc2fe32ce80bdd2b46ea))

### 2.1-preview.1-6d4e93b (10-07-2020)
* Fix: use file type library for mime type validation ([#636](https://github.com/microsoft/OCR-Form-Tools/commit/6d4e93bca8a4e3d677c765ed5596bde502766e2e))

### 2.1-preview.1-355ca0b (09-30-2020)
* feat: add spinner in saving project, can avoid multiple commit  ([#617](https://github.com/microsoft/OCR-Form-Tools/commit/355ca0b156b2d44aafd2eaaccf2fc52385c7f5f8))

### 2.1-preview.1-53044f7 (09-29-2020)
* fix: refresh currentProjects when load project ([#615](https://github.com/microsoft/OCR-Form-Tools/commit/53044f72dd9c9c72557c74c00605ba05ee50205d))
* sync related region color when tag color changed ([#598](https://github.com/microsoft/OCR-Form-Tools/commit/3044cc51a9166877bb4f01f28753171b82c04ccd))
* feat: add current list item style ([#601](https://github.com/microsoft/OCR-Form-Tools/commit/3e503e75513e44e6a90bd013d8dd15c3096cd7e9))
* fix: remove project from app if security token does not exist ([#468](https://github.com/microsoft/OCR-Form-Tools/commit/730e1963a06f038a4efa9750fcef4be6f15a8460))

### 2.1-preview.1-d859d38 (09-27-2020)
* fix ,update document state when preview (#317) ([#471](https://github.com/microsoft/OCR-Form-Tools/commit/d859d38ecc1f96b194ffa130a1840f5a7d9b1a9b))
* refactor: change the confidence value format to percentage ([#461](https://github.com/microsoft/OCR-Form-Tools/commit/e806b4e0dfcc68e6408e2130a46a318637a482a8))

### 2.1-preview.1-7a3f7a7 (09-25-2020)
* security: upgrade node-forge ([#622](https://github.com/microsoft/OCR-Form-Tools/commit/7a3f7a773c8b01f443afaad89d7974a5bbb0b869))
* fix: disable move tag and support renaming when searching ([#618](https://github.com/microsoft/OCR-Form-Tools/commit/cac1e8e6cfb2805a6540f9e80d564a0ff8be81c7))

### 2.1-preview.1-4163edc (09-23-2020)
* docs: add latest tag reference to changelog ([#608](https://github.com/microsoft/OCR-Form-Tools/commit/4163edc18bc65234e263703fc829d2f297953385))
* fix: use region instead of drawnRegion for labelType in label file ([#582](https://github.com/microsoft/OCR-Form-Tools/commit/ffafc200249a1c47698fedb279b4b55cef0190ba))
* docs: update readme with docker hub info ([#604](https://github.com/microsoft/OCR-Form-Tools/commit/63bbea076d598d0286095fa0eca48d8c9d0ed706))
* fix: remove opening browser for yarn start ([#605](https://github.com/microsoft/OCR-Form-Tools/commit/f6c4dc3585df71d09252a28f65e835a594389118))
* fix: update changelog updater script ([#607](https://github.com/microsoft/OCR-Form-Tools/commit/7c4848c3a72259562c0461f0e2eadfb4a660fa64))

### 2.1-preview.1-f2db74e (09-17-2020)
* docs: udpate changlog with docker image reference ([#590](https://github.com/microsoft/OCR-Form-Tools/commit/f2db74e322c32338eba3b2df06c01a51cfb7ebc1))

### 2.1-preview.1-1a6b78e (09-16-2020)
* fix: normalize folder path starting with a period ([#592](https://github.com/microsoft/OCR-Form-Tools/commit/1a6b78e054235da3188aafbe65636a8c18b439bf))
* fix: change label folder uri title ([#588](https://github.com/microsoft/OCR-Form-Tools/commit/7e4233e568d94817e23dda5ef5513b9ee7475d11))

### 2.1-preview.1-6a1ced5 (09-15-2020)
* fix: initialize drag pan for analyze page ([#586](https://github.com/microsoft/OCR-Form-Tools/commit/6a1ced5a0bfb03ceba515faddbfa010ac8451460))
* fix: zoomIn keyboar shortcut for macOS ([#581](https://github.com/microsoft/OCR-Form-Tools/commit/5afeebfee28e10e390f073990f90348c5117475f))
* fix: appId ([#584](https://github.com/microsoft/OCR-Form-Tools/commit/e053b151441e956641ed05c29106d02358a40792))
* fix: remove escape quote from release script ([#579](https://github.com/microsoft/OCR-Form-Tools/commit/bd5d51e8e15809b95f15bc495f7d0f91fecfc22d))
* Stew ro/support drag pan for release ([#576](https://github.com/microsoft/OCR-Form-Tools/commit/77620eccd21d564473c81b43341f59de22339248))

### 2.1-preview.1-0633507 (09-14-2020)
* Update README.md([#??](https://github.com/microsoft/OCR-Form-Tools/commit/0633507aa767f996add313ced06c2365c5f240c8))

### 2.1-preview.1-8d2286f (09-13-2020)
* persist trainPage inputs in localStorage ([#568](https://github.com/microsoft/OCR-Form-Tools/commit/8d2286f50236e41fe5540dbb9b161ea88bbf2d7a))

### 2.1-preview.1-bb23e31 (09-11-2020)
* build(deps): bump node-fetch from 2.6.0 to 2.6.1 ([#575](https://github.com/microsoft/OCR-Form-Tools/commit/bb23e3199c5721338241c8c5ccc0bda104fd15f8))
* fix: support multiple env files ([#574](https://github.com/microsoft/OCR-Form-Tools/commit/cf64a8ddde05e7e73cad37d271f5d6dfa61c5d7f))
* fix: "Azure blob storage"  error on on premise scenario ([#572](https://github.com/microsoft/OCR-Form-Tools/commit/46f0bc59f3a531c366bc2c7cec955d2cb6ed7cd6))
* fix ([#563](https://github.com/microsoft/OCR-Form-Tools/commit/28c792e10692e3cc1f511852ffc9fdbc8dcdda8a))

### 2.1-preview.1-7e828ff (09-10-2020)
* fix: allow training with placeholder ([#569](https://github.com/microsoft/OCR-Form-Tools/commit/7e828ff02ff8a22b64b4b7d16787d77afb76af62))
* docs: update changelog ([#564](https://github.com/microsoft/OCR-Form-Tools/commit/1dec72c5df3206554a1e0864b65cc769835785fd))
* Yongbing chen/human in the loop ([#517](https://github.com/microsoft/OCR-Form-Tools/commit/be9d56481510e3033bcd705743c1ee9aeee20522))
* fix: support project folder in project settings for local file system ([#559](https://github.com/microsoft/OCR-Form-Tools/commit/b92b73bb8076f9b9bb55dd38fcd223b7b93eaa2e))
* feat: enable canvas rotation ([#553](https://github.com/microsoft/OCR-Form-Tools/commit/c27a110251df1fc7a595524846e20fd09c79f915))
* fix: handle tag is undefined error ([#557](https://github.com/microsoft/OCR-Form-Tools/commit/7e4d3fbbc3a2bf925c126cd2b3f493cca48e7a62))

### 2.1-preview.1-193520e (09-08-2020)
* fix: accept selection of only .fott files for open local project ([#554](https://github.com/microsoft/OCR-Form-Tools/commit/193520e2c3e40b58c3612507efc2249aaf4e9d05))
* fix: use default shared folder for label URI when training ([#551](https://github.com/microsoft/OCR-Form-Tools/commit/656de2ff07c2083affc2adf52f1a56c5a9c024b8))
* fix: show label folder uri while training ([#539](https://github.com/microsoft/OCR-Form-Tools/commit/0ad389c06328cd6428653bb7d94d5af716e02ab7))
* feat: add canvas command bar to analyze page with only zoom buttons ([#549](https://github.com/microsoft/OCR-Form-Tools/commit/895b52740cd1e8d61b5b021e6c0d992f44ce8052))

 ### 2.1-preview.1-4852c84 (09-05-2020)
* fix buttons styles - makes them more visible ([#526](https://github.com/microsoft/OCR-Form-Tools/commit/4852c8429d25b5569c3335b014da5972cbcc6162))

### 2.1-preview.1-343ea16 (09-04-2020)
* refactor: remove array for drawn region labels ([#542](https://github.com/microsoft/OCR-Form-Tools/commit/343ea16e18199ab5098395ae8b7a164cd8bab55e))
* fix: add key prop to region icon ([#540](https://github.com/microsoft/OCR-Form-Tools/commit/87b69093f2d35d91a2a939c46ac66ba4d22a5cb7))

### 2.1-preview.1-b370c9a (09-02-2020)
* fix: resize canvas on asset preview resize ([#535](https://github.com/microsoft/OCR-Form-Tools/commit/b370c9a9bcf7da416944c626f6d4fd7bd29088bb))

### 2.1-preview.1-de1c304 (08-31-2020)
* refactor: upgrade tsconfig es2017 to esnext ([#531](https://github.com/microsoft/OCR-Form-Tools/commit/de1c30410b860c9576108f076ec4dd8273e61a79))

### 2.1-preview.1-530545c (08-28-2020)
* fix: remove existing bounding boxes from document on analyze ([#523](https://github.com/microsoft/OCR-Form-Tools/commit/6a1aedfb89b0499a0f4782e16ccbd8a06887841d))
* feat: enable download JSON of trained model ([#513](https://github.com/microsoft/OCR-Form-Tools/commits/master))

### 2.1-preview.1-529a0e8 (08-27-2020)
* fix: show loading indicator while loading model info ([#514](https://github.com/microsoft/OCR-Form-Tools/commit/529a0e819f4cb405e290f34d18d15c487a7bcfad))
* docs: update telemetry disclaimer ([#521](https://github.com/microsoft/OCR-Form-Tools/pull/521))
* fix: disable clearing of drawn regions on analyze page ([#518](https://github.com/microsoft/OCR-Form-Tools/commit/298d7c97da1278996d2ee6020d3face0785bc4eb))

### 2.1-preview.1-b2d9a0b (08-26-2020)
* docs: notice that telemetry is disabled ([#501](https://github.com/microsoft/OCR-Form-Tools/commit/b2d9a0b008ebf350dfcb5fe897fc5dfe0d4d5cb6))

### 2.1-preview.1-d9db4ee (08-24-2020)
* refactor: upgrade storage-blob to v12.1.2 ([#509](https://github.com/microsoft/OCR-Form-Tools/commit/d9db4ee027240a82feef5b54e5e406c3793d8050))
* feat: support region labeling ([#481](https://github.com/microsoft/OCR-Form-Tools/commit/dd78ed06761a341908bdb1b09e73fd1f2868431c))
* feat: support adding model to recent models from compose page ([#510](https://github.com/microsoft/OCR-Form-Tools/commit/65fc92b5737ceea14ff89aa78052be26835ad0ae))

### 2.1-preview.1-2402cba (08-17-2020)
* fix: notify error message when open project with invalid security token ([#506](https://github.com/microsoft/OCR-Form-Tools/commit/2402cbaf73eba47ad188f851227c04cd44a208d4))

### 2.1-preview.1-a8ef8fa (08-17-2020)
* fix: don't allow create or update connection with duplicate name ([#486](https://github.com/microsoft/OCR-Form-Tools/commit/a8ef8fab603b3d2c08c533cb5dfe67da117942a0))

### 2.1-preview.1-530545c (08-14-2020)
* fix: "failed to fetch()" error ([#491](https://github.com/microsoft/OCR-Form-Tools/commit/530545c7cd2b4a3ff444e9c7e1f40c68d4a7376c))
* fix: sync layer visibility ([#497](https://github.com/microsoft/OCR-Form-Tools/commit/bea552b28acb9b652ffaedf40009d6df5a3197ef))
* refactor: disable telemetry service ([#498](https://github.com/microsoft/OCR-Form-Tools/commit/6e3628cf174f954693380aab6ebd2dabe027ac6d))
* fix: change share class name for adblocker chrome extension ([#492](https://github.com/microsoft/OCR-Form-Tools/commit/aa8a73afc6344f3164e79f236d5fa4bb0f64d364))

### 2.1-preview.1-da405b3 (08-10-2020)
* fix: restrict tag type through hot keys ([#482](https://github.com/microsoft/OCR-Form-Tools/commit/da405b354428b829e895a35a020736b1d88c153f))
* docs: add share project description to README ([#488](https://github.com/microsoft/OCR-Form-Tools/commit/7ee215f735a84aaa30201748d19207bcc6a05580))

### 2.1-preview.1-29d1f93 (08-07-2020)
* fix: handle multi selection of non-compatible types with multi-selection tool ([#487](https://github.com/microsoft/OCR-Form-Tools/commit/29d1f93a290e55fdd84f8cf2ee9a914fed702beb))

### 2.1-preview.1-cef225f (08-06-2020)
* fix: handle undefined image map error ([#462](https://github.com/microsoft/OCR-Form-Tools/commit/cc9e9bfc8fe00bb0ed154edb791446f28060af4e))
* fix: handle undefined image map error ([#479](https://github.com/microsoft/OCR-Form-Tools/commit/cef225f3346628e79c46e799303400965f1d3c96))

### 2.1-preview.1-76945df (08-05-2020)
* fix: use english for telemetry reporting ([#472](https://github.com/microsoft/OCR-Form-Tools/commit/76945df3bdf9caba3ba13f4541e17e75b9574b33))
* fix: resolve unhandled exeptions and new message for OCR service on 400 ([#470](https://github.com/microsoft/OCR-Form-Tools/commit/76381bc659a365ead19387b933485530d2d5edc3))
* feature: enable popup with composed model info ([#460](https://github.com/microsoft/OCR-Form-Tools/commit/c1f5d803f047e5ca0d18fea6383b3baf56d116ff))

### 2.1-preview.1-f4d53ce (08-03-2020)
* fix: bump elliptic from 6.5.2 to 6.5.3 ([#469](https://github.com/microsoft/OCR-Form-Tools/commit/f4d53cec967194445885bd3748096f0a3ce10715))
* feat: add modelCompose icon and created time ([#466](https://github.com/microsoft/OCR-Form-Tools/commit/2fa32ef5f77ec7bb44bf42e9fc0a5fdf7f0330c3))

### 2.1-preview.1-78996ea (07-31-2020)
* refactor: relocate share button ([#464](https://github.com/microsoft/OCR-Form-Tools/commit/78996ea65616b28d7471b59f4f16f254d7d33127))

### 2.1-preview.1-0e1b637 (07-29-2020)
* feat: show only ready models in the list ([#459](https://github.com/microsoft/OCR-Form-Tools/commit/0e1b637003f289c56955342f44963003c1543436))

### 2.1-preview.1-84f8285 (07-27-2020)
* fix: show message on model composition fail ([#457](https://github.com/microsoft/OCR-Form-Tools/commit/84f82859122ff298bcfcca78e821e8bfe437bb78))
* refactor: add background on popup table ([#446](https://github.com/microsoft/OCR-Form-Tools/commit/27f60df5617da2efba8ffdd601233e0c0f4c8e3e))

### 2.1-preview.1-79264e3 (07-24-2020)
* fix: handle rejection for security token not found when opening projects ([#441](https://github.com/microsoft/OCR-Form-Tools/commit/79264e3fddfb2c80b88bf8ca21df1e869082ffcf))
* fix: show more refined error message for model not found analysis error ([#454](https://github.com/microsoft/OCR-Form-Tools/commit/1cb4133dca0092559e7524dfad8c0bf54502dc81))
* feat: support group selection of words with drawn bounding box ([#447](https://github.com/microsoft/OCR-Form-Tools/commit/b4332a926b1925024a33731a90d303c0b171935b))
* feat: add apiVersion to telemetry ([#448](https://github.com/microsoft/OCR-Form-Tools/commit/55be5427e4a2f9c8cf393d446049527c55f841d4))
* fix: margin for filenames in asset preview ([#451](https://github.com/microsoft/OCR-Form-Tools/commit/fe8258f9c7ceba663a66708b19bc0e6556e777ad))
* docs: add telemetry disclaimer to readme ([#449](https://github.com/microsoft/OCR-Form-Tools/commit/87356a1cf6678bb9494e83178bf6282ca366921f))

### 2.1-preview.1-9b5b99d (07-23-2020)
* docs: add get-sas.png (https://github.com/microsoft/OCR-Form-Tools/commit/9b5b99d5468661481ae8165593d5a74471366429)
* doc: add a screenshot of getting SAS token (https://github.com/microsoft/OCR-Form-Tools/commit/87b1062125ed106ff73c036e33f1bf7a5f2c3def)
* fix: handle undefined error for pdf asset preview memory cleaning ([#442](https://github.com/microsoft/OCR-Form-Tools/commit/9b5b99d5468661481ae8165593d5a74471366429))
* fix: remove duplicate models in model composed model list ([#439](https://github.com/microsoft/OCR-Form-Tools/commit/7fcc9ccfdb6634326ddd6cbfe99b423300b94131))
* feat: enable internal telemetry ([#431](https://github.com/microsoft/OCR-Form-Tools/commit/41294c8aa19c82643fe0df669c21a0112668e0dd))

### 2.1-preview.1-f4b4d5d (07-21-2020)
* fix: use table for model selection info ([#438](https://github.com/microsoft/OCR-Form-Tools/commit/f4b4d5ded4b7e0ff2116ba3b8f97e49fbf30b7c0))
* fix: reset model name after training ([#434](https://github.com/microsoft/OCR-Form-Tools/commit/ed919a016b150d0938aee25b5550bacf29f04e83))
* fix: wait for loadeding project with sharing project ([#435](https://github.com/microsoft/OCR-Form-Tools/commit/fc4cb96d2a9d0920c3bbbd9c2000fb4b1b7ac9c0))

### 2.1-preview.1-46dbb2b (07-20-2020)
* fix: handle no recent models for model compose ([#432](https://github.com/microsoft/OCR-Form-Tools/commit/46dbb2be9ee6100a8f3e6a443ad5e734c60954bb))
* refactor: use new model compose icon ([#425](https://github.com/microsoft/OCR-Form-Tools/commit/932fb3fd7f84636e97035f4cafadc87cff18b3b3))
* fix: support long model names for model selection ([#427](https://github.com/microsoft/OCR-Form-Tools/commit/a0fa2daf4cd3286f7f58dc2919fd202115e8d5be))
* feat add recent models to top of model compose page's list ([#430](https://github.com/microsoft/OCR-Form-Tools/commit/cf8de6be61b95bfe8c937946df71ea81aecb35f9))
* fix: check valid connection ([#428](https://github.com/microsoft/OCR-Form-Tools/commit/9cb6c5830afddc9317ffdfe6927b581c4d39ba39))

### 2.1-preview.1-162a766 (07-17-2020)
* refactor: make confidence results same as JSON results ([#409](https://github.com/microsoft/OCR-Form-Tools/commit/162a7660cfe32b72c4954a147269c5d2b7f55a08))
* fix: prevent user from leaving page while composing ([#422](https://github.com/microsoft/OCR-Form-Tools/commit/63e179d0152d2f8f2ee764443785efa24e5f7dce))
* feat: support model selection ([#419](https://github.com/microsoft/OCR-Form-Tools/commit/b4c4cc5a8a980aaa6530e7a4a5a1c43e77494c75))
* feat: share project ([#344](https://github.com/microsoft/OCR-Form-Tools/commit/d059580cfefa053670c45c5d8ec7bf250bc4db27))

### 2.1-preview.1-89be3ac (07-15-2020)
* fix: on assetFormat undefined ([#413](https://github.com/microsoft/OCR-Form-Tools/commit/89be3ac5b614e91607d7fb8065ad32b69886040d))
* fix: make sure token names are unique ([#404](https://github.com/microsoft/OCR-Form-Tools/commit/d8fa6141cff4d00ba22e95ef4f5dcc9102e1c1c2))
* fix: model info enclosing element error on [#407](https://github.com/microsoft/OCR-Form-Tools/issues/407) ([#408](https://github.com/microsoft/OCR-Form-Tools/commit/8cc421c3fee0e781211efb0aeb2b345075012daa))
* fix: display composed icon for composed model with attribute ([#399](https://github.com/microsoft/OCR-Form-Tools/commit/18fb4d71052b9355c8d5a4f7dde956ba17ca30fa))

### 2.1-preview.1-b67191c (07-09-2020)
* fix: don't allow choosing not-ready models for compose ([#394](https://github.com/microsoft/OCR-Form-Tools/commit/b67191cdbc872b9004be30aa4b4dfde9a88dfe37))
* feat: track five most recent project models ([#395](https://github.com/microsoft/OCR-Form-Tools/commit/05850603d51a6786c8b6e8b4a553db020df56158))

### 2.1-preview.1-abc6376 (07-08-2020)
* feat: enable model info in analyze results ([#383](https://github.com/microsoft/OCR-Form-Tools/commit/abc63767e97dd28a6bb9028e03f2225e6ac0f1ab))
* fix: check invalid provider options before project actions ([#390](https://github.com/microsoft/OCR-Form-Tools/commit/212647d4327d9e18e9248a2d39086eeaab404979))

### 2.1-preview.1-a334cfc (07-07-2020)
* fix: hide extra scrollbars for model compose view ([#380](https://github.com/microsoft/OCR-Form-Tools/commit/a334cfc45fc5ab137682ad2b48dd0ec1585055dc))
* fix: handle version change state mutation error ([#382](https://github.com/microsoft/OCR-Form-Tools/commit/8991cc0c92f2f5cbd226f7e1c5c0825b7af8937c))
* fix: handle pdf worker terminated error ([#381](https://github.com/microsoft/OCR-Form-Tools/commit/adc0498c31bfd5ba57ab98c373e73575589ab1e1))

### 2.1-preview.1-7192170 (07-02-2020)
* feat: support release ([#361](https://github.com/microsoft/OCR-Form-Tools/commit/7192170d73d24a43e7fff18cd2c6bae7f208f1b0))

### 2.1-preview.1-978dabc (07-01-2020)
* feat: support document management ([#374](https://github.com/microsoft/OCR-Form-Tools/commit/978dabc3ba877ed4215865cba2a583fb785a2894))

### 2.1-preview.1-56a4b89 (06-30-2020)
* fix: wait until composed model is ready ([#369](https://github.com/microsoft/OCR-Form-Tools/commit/56a4b89f370f2fd72c6bc275376205e7fffe6a9e))

### 2.1-preview.1-6114d64 (06-23-2020)
* fix: update OCR version ([#335](https://github.com/microsoft/OCR-Form-Tools/commit/6114d6456b27a59335e534eef72cefd1b2f15737))
* feat: support electron for on premise solution ([#333](https://github.com/microsoft/OCR-Form-Tools/commit/ca0bd0c2ab46b7b587e5bfbc60c29b62bb325297))

### 2.1-preview.1-8297b18 (06-19-2020)
* refactor: put api version in constants ([#332](https://github.com/microsoft/OCR-Form-Tools/commit/8297b18a084be86bc4c986a1a332cb40bd807d1b))

### 2.1-preview.1-3b7f803 (06-18-2020)
* feat: enable model compose (preview) ([#328](https://github.com/microsoft/OCR-Form-Tools/commit/3b7f803407b82191706120bb9f12b82de1955704))
* fix: quick reordering tags ([#322](https://github.com/microsoft/OCR-Form-Tools/commit/3cc5267ef8617590adb3d4966f75cfed64604f00))
* feat: localization for canvas commandbar items ([#319](https://github.com/microsoft/OCR-Form-Tools/commit/253b9c90eb4923e7fde015a7216905fa32a8dcfa))
* feat: enable re-run OCR ([#297](https://github.com/microsoft/OCR-Form-Tools/commit/cbe9b0ed1c48f54c100b31b7f04706a969df2dd5))
* fix: capitalize python in analyze page ([#320](https://github.com/microsoft/OCR-Form-Tools/commit/96626636a96a3d19030df283ac794fa9c2aab18c))
* fix: fix spelling correction for string match ([#318](https://github.com/microsoft/OCR-Form-Tools/commit/28e53cefcf0bb462d547d6e38b24c480c03b946f))
* feature: keep prediction in UI ([#285](https://github.com/microsoft/OCR-Form-Tools/commit/dad98b9bd1d305a6bfeb2846ef4067da186ff801))

### 2.0.0-1c39800 (06-05-2020)
* feat: add description - how to delete info ([#292](https://github.com/microsoft/OCR-Form-Tools/commit/1c39800b1152f186dfc19834bb969abbc4fe0ac2))
* feat: enable download analyze script ([#304](https://github.com/microsoft/OCR-Form-Tools/commit/9c97ed0ff9b0aa72ec9a197fc92f3a5998135c36))
* fix: check ocrread results before getting image extent ([#296](https://github.com/microsoft/OCR-Form-Tools/commit/61dba02fc6f19eb854e1f499e475b1336e6171b9))
* feat: Add better error message for CORS ([#289](https://github.com/microsoft/OCR-Form-Tools/commit/8f210792b4d84e424b00499efb540b0e27e9fdad))

### 2.0.0-2760166 (05-30-2020)
* fix: fix mime check bug for jpeg/jpg and tiff ([#291](https://github.com/microsoft/OCR-Form-Tools/commit/2760166bcb809bbfdc207b01db49f00153318624))
* refactor: simplify shortcut descriptions ([#277](https://github.com/microsoft/OCR-Form-Tools/commit/db95b0e2510f6cef9bc7279fe0a19dce239c816e))

### 2.0.0-a5e4e07 (05-21-2020)
* feature: show table view when table icon is clicked ([#271](https://github.com/microsoft/OCR-Form-Tools/commit/a5e4e079d4c0d1c7c52e3b015c0ddf9b8601bbf2))

### 2.0.0-814276a (05-20-2020)
* fix: modify skip button according to feedback comments ([#264](https://github.com/microsoft/OCR-Form-Tools/commit/814276af6f4259844854798adf0c56bd606b2363))
* feature: keyboard shortcuts and tips ([#258](https://github.com/microsoft/OCR-Form-Tools/commit/37aa859a80dc0213a118313558ad21ba424008e7))
* feat: add electron mode from VoTT project ([#260](https://github.com/microsoft/OCR-Form-Tools/commit/2a3383d4a0f100a39ed40627bdffb9b48f78f5df))
* refactor: use forEach instead of map in handleFeatureSelect ([#259](https://github.com/microsoft/OCR-Form-Tools/commit/c1c590c463743d187fda2429a628e27c6c42012f))

### 2.0.0-0061645 (05-13-2020)
* build: update nginx base image version to 1.18.0-alpine ([#255](https://github.com/microsoft/OCR-Form-Tools/commit/0061645871806595e4fe2ab5991cc494afa26b31))
* fix: assign empty string when predict item's fieldName is undefined ([#254](https://github.com/microsoft/OCR-Form-Tools/commit/d4d919f678b1f162f48c87ee5223281e57945a0a))
* fix: overlaping left split pane ([#252](https://github.com/microsoft/OCR-Form-Tools/commit/2e8c351f74c385b8627ee6ea39f974e5e048ea8d))
* refactor: change predict to analyze in UI while keeping predict term ([#147](https://github.com/microsoft/OCR-Form-Tools/commit/c9aa58e36a10a35083249a8080c2cfb9fccf3733))
### 2.0.0-7c7ba93 (05-07-2020)
* fix: check null value from post processed value ([#248](https://github.com/microsoft/OCR-Form-Tools/commit/a361189c527bfffd6417f90a2521ad40b2b3f205))
* feat: enable outputting to file for analyze script ([#246](https://github.com/microsoft/OCR-Form-Tools/commit/7c7ba937f140490775b788d63ef2c7ed63ca40f1))
### 2.0.0-9d91800 (05-06-2020)
* fix: prevent user from changing tag types when invalid ([#224](https://github.com/microsoft/OCR-Form-Tools/commit/d8823a33591db5c5dc9a0af753e007167218a3e3))
* fix: prevent user from adding multiple checkboxes to a single tag ([#224](https://github.com/microsoft/OCR-Form-Tools/commit/d8823a33591db5c5dc9a0af753e007167218a3e3))
* fix: display error when inputted SAS doesn't contain token ([#243](https://github.com/microsoft/OCR-Form-Tools/commit/9826ca8504549f23057c9cad1baebc5e9d1f6fe7))
### 2.0.0-25d3298 (05-04-2020)
* feat: track document count for tags ([#231](https://github.com/microsoft/OCR-Form-Tools/commit/70a6e43dc54239cdc153d5d328b17c1dfa0f085f))
* fix: display error when inputted service URI contains path or query ([#234](https://github.com/microsoft/OCR-Form-Tools/commit/04a16961b37ad5b5d01fc4c93addaaf69cbf0e72))
* feat: add link in status bar to CHANGELOG ([#233](https://github.com/microsoft/OCR-Form-Tools/commit/e66646a13263239213580378bbd2d8462d7e22b6))
### 2.0.0-f6c8ffa (05-01-2020)
* refactor: change checkbox to selectionMark ([#223](https://github.com/microsoft/OCR-Form-Tools/commit/f6c8ffad6edf23f6241f314e9456da92bc1a8402))
### 2.0.0-f3e42f6 (04-30-2020)
* feat: display post-processed value in analyzed results ([#229](https://github.com/microsoft/OCR-Form-Tools/commit/f3e42f6e8e9e934f1a241921dbe4a1e8d311bb46))
### 2.0.0-f068866 (04-28-2020)
* fix: hide sprin in tag input control when open an empty folder ([#220](https://github.com/microsoft/OCR-Form-Tools/commit/f0688668df2e676fce9749fad8ec9d39e56697cf))
* perf: cache images, reduce canvas size, and fix memory leak for asset preview ([#218](https://github.com/microsoft/OCR-Form-Tools/commit/e8ad9a3bebf2a1ae210e0e1fa3eebba564592c4c))
### 2.0.0-595a512 (04-24-2020)
* fix: align rotated picture asset with OCR result
### 2.0.0-51c02cc (04-20-2020)
* fix: scrollbar fix when page size changes
* fix: Add split pane to fix too long tag name is invisible in right sidebar
### 2.0.0-202fb2f (04-20-2020)
* perf: improve assets loading performance and fix some bugs
### 2.0.0-bce554e (04-16-2020)
* perf: improve Azure Blob file list performance
* feat: support URL upload for predicting file
### 2.0.0-ef18425 (04-09-2020)
* feat: enable checkbox labeling (preview)
