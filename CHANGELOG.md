# FoTT Changelog 
## Released conatiner's currently referenced commit
2.1-Preview's released container image (mcr.microsoft.com/azure-cognitive-services/custom-form/labeltool:2.1.012970002-amd64-preview) currently references **2.1-preview.1-0633507 (09-14-2020)**

## Commit history
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
