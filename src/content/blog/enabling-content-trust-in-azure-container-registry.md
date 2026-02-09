---
title: "Enabling Content Trust in Azure Container Registry"
description: "Docker Content Trust provides the ability to use digital signatures for data sent to and received from remote Docker registries."
pubDate: 2020-05-15
tags: ["Docker", "Azure", "security"]
---

[Docker Content Trust](https://docs.docker.com/engine/security/trust/content_trust/) provides the ability to use digital signatures for data sent to and received from remote Docker registries. These signatures allow client-side verification of the integrity and publisher of specific image tags.

Using DCT, image publishers can sign their images and consumers, those that pull those images, can check whether those images have been signed.

DCT can be also used in Azure Container Registries (ACR). Let me walk you through by showing how to push a simple `hello-world` image to ACR.

## Prerequisites

- [Docker](https://docs.docker.com/get-docker/) installed locally
- [Azure CLI](https://docs.microsoft.com/en-us/cli/azure/install-azure-cli?view=azure-cli-latest) installed locally (although everything can be done also in the Azure Portal)

## Creating the Azure Container Registry

Let's start by creating an Azure Resource Group under which we will create our repository.

```bash
export RESOURCE_GROUP_NAME="resourcegroupdavid"
az group create --name $RESOURCE_GROUP_NAME --location westeurope
```

Now we should have our resource group ready (`resourcegroupdavid` in my case). With the resource group ready, we can now continue and create the container repository itself.

```bash
export REGISTRY_NAME="registrydavid"
az acr create --resource-group $RESOURCE_GROUP_NAME --name $REGISTRY_NAME --sku Premium
```

To enable Content Trust in Azure Container Registry you need Premium SKU tier and that's why we added `--sku Premium` into the command. With this, we should have a resource group `resourcegroupdavid` and registry `registrydavid`. However, the Content Trust is disabled by default. We can enable it using following command

```bash
az acr config content-trust update -r $REGISTRY_NAME --status Enabled
```

## Creating a service account

To push signed images into our registry, we will create a service account with `AcrImageSigner` and `AcrPush` roles. You can either create the user in the `Access control (IAM)` part of the registry or call the following command

```bash
az ad sp create-for-rbac --name DavidServiceAccount
```

The command will return a JSON which contains the username (`appId`) and password which we will use to assign roles and later log in

```json
{
  "appId": "...",
  "displayName": "DavidServiceAccount",
  "name": "http://DavidServiceAccount",
  "password": "...",
  "tenant": "..."
}
```

Now we have a service account `DavidServiceAccount` created and we can add required roles to that account.

```bash
az role assignment create --assignee $APP_ID --role AcrImageSigner
az role assignment create --assignee $APP_ID --role AcrPush
```

The last step is signing in with the service account. The following command will also store your Azure Active Directory token in the `docker.config` file so all further `docker` commands will be done under the service account.

```bash
az acr login --name $REGISTRY_NAME -u $APP_ID -p $PASSWORD
```

## Pushing an unsigned image

Our image, which we will push into our new registry will be based on the [Docker's Hello World image](https://hub.docker.com/_/hello-world). So let's pull the image.

```bash
docker pull hello-world
```

Before we can push the image, we must tag it with the fully qualified name of our registry.

```bash
docker tag hello-world registrydavid.azurecr.io/hello-world:unsigned
```

Now we can push the image into our registry.

```bash
docker push registrydavid.azurecr.io/hello-world:unsigned
```

This should push a `hello-world` image tagged `unsigned` into our registry. How do we sign the image tag though?

## Enabling Docker Content Trust

Whole Docker Content Trust can be enabled by setting an environment variable `DOCKER_CONTENT_TRUST`.

```bash
export DOCKER_CONTENT_TRUST=1
```

Now, once we enabled the DCT, our client will start verifying signatures. That means, that if we try to pull an image which is not signed, we should get an error.

```
$ docker pull registrydavid.azurecr.io/hello-world:unsigned
No valid trust data for v4
```

The client will also start signing image tags that we try to push into registries. Let's create a new tag that we will sign.

```bash
docker tag hello-world registrydavid.azurecr.io/hello-world:signed
```

Now that we have a new image with tag `signed` we can push it.

```
$ docker push registrydavid.azurecr.io/hello-world:signed

The push refers to repository [registrydavid.azurecr.io/hello-world]
9c27e219663c: Layer already exists
signed: digest: sha256:90659bf80b44ce6be8234e6ff90a1ac34acbeb826903b02cfa0da11c82cbc042 size: 525
Signing and pushing trust metadata
You are about to create a new root signing key passphrase. This passphrase
will be used to protect the most sensitive key in your signing system. Please
choose a long, complex passphrase and be careful to keep the password and the
key file itself secure and backed up. It is highly recommended that you use a
password manager to generate the passphrase and keep it safe. There will be no
way to recover this key. You can find the key in your config directory.
Enter passphrase for new root key with ID 1ed587e:
Repeat passphrase for new root key with ID 1ed587e:
Enter passphrase for new repository key with ID b2c4e9e:
Repeat passphrase for new repository key with ID b2c4e9e:
Finished initializing "registrydavid.azurecr.io/hello-world"
Successfully signed registrydavid.azurecr.io/hello-world:signed
```

Once you push the image with the `signed` tag, you will be prompted for two passphrases (if you have never done it before). After entering those passphrases, your signed image tag will be successfully pushed. Now when you try to pull the image, you should get no error.

```bash
docker pull registrydavid.azurecr.io/hello-world:signed
```

If you want to know how the content trust works in details, you can go through [Docker Content Trust documentation](https://docs.docker.com/engine/security/trust/content_trust/).
