# Deploying to Google Cloud

## Accounts
View active accounts
```shell
gcloud auth list
```

Set account and view the projects to set to
```shell
gcloud config set account example@example.com
gcloud projects list
```

If login needed, do the following and then proceed to set project
```shell
gcloud auth login
```

Set project
```shell
gcloud config set project <<project-id>>
```

# Docker
Build and deploy to GCR. Replace {project} with your project name.
```shell
docker build --platform linux/amd64 -t gcr.io/{project}/gameserver .
docker push gcr.io/{project}/gameserver
```

Deploy Cloud Run instance.

```shell
gcloud run deploy gameserver \
  --image gcr.io/{project}/gameserver \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --port 8000 \
  --update-env-vars FLOW_SERVER=FALSE,CORS_ALL=FALSE \
  --memory 1G \ 
  --min-instances 1 
```
