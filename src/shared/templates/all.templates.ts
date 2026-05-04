import { AppTemplateModel } from "../model/app-template.model";
import { wordpressAppTemplate } from "./apps/wordpress.template";
import { mariadbAppTemplate } from "./databases/mariadb.template";
import { mongodbAppTemplate } from "./databases/mongodb.template";
import { mysqlAppTemplate } from "./databases/mysql.template";
import { postgreAppTemplate } from "./databases/postgres.template";
import { post创建RedisAppTemplate, redisAppTemplate } from "./databases/redis.template";
import { n8nAppTemplate, post创建N8NAppTemplate } from "./apps/n8n.template";
import { noderedAppTemplate } from "./apps/nodered.template";
import { huginnAppTemplate } from "./apps/huginn.template";
import { nextcloudAppTemplate } from "./apps/nextcloud.template";
import { minioAppTemplate } from "./apps/minio.template";
import { filebrowserAppTemplate } from "./apps/filebrowser.template";
import { grafanaAppTemplate } from "./apps/grafana.template";
import { prometheusAppTemplate } from "./apps/prometheus.template";
import { uptimekumaAppTemplate } from "./apps/uptimekuma.template";
import { plausibleAppTemplate } from "./apps/plausible.template";
import { rocketchatAppTemplate } from "./apps/rocketchat.template";
import { mattermostAppTemplate } from "./apps/mattermost.template";
import { elementAppTemplate } from "./apps/element.template";
import { giteaAppTemplate } from "./apps/gitea.template";
import { forgejopAppTemplate } from "./apps/forgejo.template";
import { jenkinsAppTemplate } from "./apps/jenkins.template";
import { droneAppTemplate } from "./apps/drone.template";
import { sonarqubeAppTemplate } from "./apps/sonarqube.template";
import { harborAppTemplate } from "./apps/harbor.template";
import { jellyfinAppTemplate } from "./apps/jellyfin.template";
import { immichAppTemplate } from "./apps/immich.template";
import { photoprismAppTemplate } from "./apps/photoprism.template";
import { navidiomeAppTemplate } from "./apps/navidrome.template";
import { wikijsAppTemplate } from "./apps/wikijs.template";
import { outlineAppTemplate } from "./apps/outline.template";
import { docmostAppTemplate, post创建DocmostAppTemplate } from "./apps/docmost.template";
import { hedgedocAppTemplate } from "./apps/hedgedoc.template";
import { vaultwardenAppTemplate } from "./apps/vaultwarden.template";
import { ghostAppTemplate } from "./apps/ghost.template";
import { nginxAppTemplate } from "./apps/nginx.template";
import { adminerAppTemplate } from "./apps/adminer.template";
import { drawioAppTemplate } from "./apps/drawio.template";
import { dozzleAppTemplate } from "./apps/dozzle.template";
import { homeassistantAppTemplate } from "./apps/homeassistant.template";
import { duplicatiAppTemplate, post创建DuplicatiAppTemplate } from "./apps/duplicati.template";
import { openwebuiAppTemplate, post创建OpenwebuiAppTemplate } from "./apps/openwebui.template";
import { AppExtendedModel } from "../model/app-extended.model";
import { tikaAppTemplate } from "./apps/tika.template";
import { libredeskAppTemplate, post创建LibredeskAppTemplate } from "./apps/libredesk.template";
import { chiselAppTemplate, post创建ChiselAppTemplate } from "./apps/chisel.template";


export const databaseTemplates: AppTemplateModel[] = [
    postgreAppTemplate,
    mongodbAppTemplate,
    mariadbAppTemplate,
    mysqlAppTemplate,
    redisAppTemplate,
];

// the commented out templates aren't tested yet.

export const appTemplates: AppTemplateModel[] = [
    wordpressAppTemplate,
    n8nAppTemplate,
    //noderedAppTemplate,
    //huginnAppTemplate,
    nextcloudAppTemplate,
    minioAppTemplate,
    //filebrowserAppTemplate,
    // grafanaAppTemplate,
    //prometheusAppTemplate,
    uptimekumaAppTemplate,
    //plausibleAppTemplate,
    //rocketchatAppTemplate,
    //mattermostAppTemplate,
    //elementAppTemplate,
    giteaAppTemplate,
    //forgejopAppTemplate,
    //jenkinsAppTemplate,
    //droneAppTemplate,
    //sonarqubeAppTemplate,
    //harborAppTemplate,
    //jellyfinAppTemplate,
    //immichAppTemplate,
    //photoprismAppTemplate,
    //navidiomeAppTemplate,
    //wikijsAppTemplate,
    //outlineAppTemplate,
    docmostAppTemplate,
    //hedgedocAppTemplate,
    //vaultwardenAppTemplate,
    //ghostAppTemplate,
    nginxAppTemplate,
    adminerAppTemplate,
    drawioAppTemplate,
    //dozzleAppTemplate,
    //homeassistantAppTemplate,
    duplicatiAppTemplate,
    openwebuiAppTemplate,
    tikaAppTemplate,
    libredeskAppTemplate,
    chiselAppTemplate
];

export const post创建TemplateFunctions: Map<string, (createdApps: AppExtendedModel[]) => Promise<AppExtendedModel[]>> = new Map([
    [openwebuiAppTemplate.name, post创建OpenwebuiAppTemplate],
    [libredeskAppTemplate.name, post创建LibredeskAppTemplate],
    [redisAppTemplate.name, post创建RedisAppTemplate],
    [docmostAppTemplate.name, post创建DocmostAppTemplate],
    [duplicatiAppTemplate.name, post创建DuplicatiAppTemplate],
    [n8nAppTemplate.name, post创建N8NAppTemplate],
    [chiselAppTemplate.name, post创建ChiselAppTemplate],
]);


export const allTemplates: AppTemplateModel[] = databaseTemplates.concat(appTemplates);