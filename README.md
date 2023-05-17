# StudentCode Backend
![online](https://img.shields.io/website?down_color=red&down_message=offline&style=plastic&up_color=green&up_message=online&url=http%3A%2F%2Fbawix.xyz%3A81%2Fapp%2F)
---
![veľkosť](https://img.shields.io/github/repo-size/dominikvozr/DP-backend?color=gree&label=ve%C4%BEkos%C5%A5)
![počet súborov](https://img.shields.io/github/directory-file-count/dominikvozr/DP-Backend?label=s%C3%BAbory&style=plastic)
![riadkov kódu](https://img.shields.io/tokei/lines/github/dominikvozr/DP-Backend?style=plastic)
![posledný commit](https://img.shields.io/github/last-commit/dominikvozr/DP-Backend?label=posledn%C3%BD%20commit&logo=github&style=plastic)
![počet jazykov](https://img.shields.io/github/languages/count/dominikvozr/DP-Backend?color=azure&label=jazyky&style=plastic)
![prevažujúci jazyk](https://img.shields.io/github/languages/top/dominikvozr/DP-Backend?color=white&logo=typescript&logoColor=white&style=plastic)


---
###### SK

Tento repozitár obsahuje zdrojový kód Diplomových prác **Skúškový systém - Virtualizované vývojové prostredie** a
**Skúškový systém - Automatizované vyhodnotenie študentských projektov**. Tento README súbor slúži ako technická príručka implementovaného kódu. Súčasnú verziu aplikácie si môžete pozrieť na [tomto linku](http://bawix.xyz:81/app/professor/)
---
### Štruktúra zdrojového kódu
* be-chart/ - DevOps konfiguračné funkcie na nasadenie na Kubernetes Klaster
    * [values](be-chart/values.yaml) - premenné podu.
* be-chart/templates/
    * [deployment](be-chart/template/deployment.yaml) - definované nasadenie na kubernetes cluster.
    * [ingress](be-chart/template/ingress.yaml) - nastavenie reverznej proxy.
    * [service](be-chart/template/service.yaml) - nastavenie služby.
    * [service account](be-chart/template/serviceaccount.yaml) - nastavenie autentifikácie
* jobs/
    * [index](jobs/index.ts) - spustenie plánovača
* server/
    * [server](server/server.ts) - základne nastavenia servera
    * [google strategy](server/google-strategy.ts) - Google OAuth2 implementácia
    * [gitea auth](server/gitea-auth.ts) - autentifikácia pre Gitea server
    * [connect](server/connect.ts) - pripojenie ku databáze
* server/models - databázove modely
    * [event](server/models/Events.ts) - EventModel a EventClass
    * [exam](server/models/Exam.ts) - ExamModel a ExamClass
    * [pipeline](server/models/Pipeline.ts) - PipelineModel a PipelineClass
    * [report](server/models/Report.ts) - ReportModel a ReportClass
    * [test](server/models/Test.ts) - TestModel a TestClass
    * [user](server/models/User.ts) - UserModel a UserClass
* server/scheduler - implementácia plánovača na spúštanie a zatváranie testov
    * [close exam](server/scheduler/close-exam.js)  - vytvorenie fronty na zatváranie testov
    * [scheduler](server/scheduler/scheduler.ts) -  definícia triedy Scheduler  
* server/service-apis - pomocné triedy a funkcie na prácu s ostatnými službami
    * [datetime service](server/service-apis/dateTimeService.ts) -  pomocná trieda DateTimeService na prácu s časovými reťazcami  
    * [gitea](server/service-apis/gitea.ts) -  trieda Gitea na vytváranie a manažovanie repozitárov
    * [jenkins](server/service-apis/jenkins.ts) -  trieda Jenkins na pripojenie ku službe Jenkins slúžiacej na prácu s automatizovaným testovaním 
    * [system evaluation](server/service-apis/systemEvaluation.ts) -  definícia triedy SystemEvaluation slúžiacej na celkovú funkčnosť automatizovaného testovania a evaluácie výsledkov
* server/api - api koncové body
    * [index](server/api/index.ts) - vytvorenie koncových bodov a middleware funkcií na autorizáciu
    * [public](server/api/public.ts) - verejný testovací koncový bod
    * [user](server/api/user.ts) - koncové body na manažovanie používateľa aplikácie 
* server/api/coder-api - koncové body pre komunikáciu s platformou Coder
    * [worskpaces](server/api/coder-api/workspaces.ts) - vytváranie a manažovanie virtuálnych vývojových prostredí
    * [organizations](server/api/coder-api/organizations.ts) - manažovanie organizácií (nepoužívané)
    * [users](server/api/coder-api/users.ts) - vytváranie, prihlasovanie a manažovanie používateľov v rámci platformy Coder
    * [utils/utils](server/api/coder-api/utils/utils.ts) - pomocné funkcie
* [server/api/event/index](server/api/event/index.ts) - posielanie a uprovanie akcií
* [server/api/git/index](server/api/git/index.ts) - koncové body na nahrávanie súborov do repozitárov, mazanie a upravovanie repozitárov
* [server/api/pipeline/index](server/api/pipeline/index.ts) - vytváranie pipelines na automatizované testovanie riešení
* [server/api/professor/index](server/api/professor/index.ts) - nahrávanie zadaní, vytváranie a manažovanie testov 
* server/api/student - koncové body pre typ používateľa študent
    * [index](server/api/student/index.ts) - vytváranie testových repozitárov pre študenta, posielanie potrebných dát pre pripojenie do virtuálneho vývojového prostredia
    * [evaluation](server/api/student/evaluation.ts) - zobrazovanie vyhodnotenia riešenia a spúšťanie procesov na automatizované testovanie riešení
* [server/api/report/index](server/api/report/index.ts) - vytváranie reportov a ich manažovanie
* [server/utils/slugify](server/utils/slugify.ts) - pomocné funkcie na vytváranie jedinečných identifikátorov
---
###### 2023
