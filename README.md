# Sync with Yandex Object Storage (S3)

This flow allows you to deploy to [Yandex Object Storage](https://cloud.yandex.ru/docs/storage/operations/hosting/setup) 
so you can use it with Yandex CDN for a static site serving.

## Configuration

| Key                              | Value                                         | Type      | Required |
|----------------------------------|-----------------------------------------------| --------- | -------- |
| `YANDEX_CLOUD_ACCESS_KEY_ID`     | Service account access key id                 | `string`  | Yes      |
| `YANDEX_CLOUD_SECRET_ACCESS_KEY` | Service account secret access key             | `string`  | Yes      |
| `YANDEX_CLOUD_BUCKET_NAME`       | Bucket name                                   | `string`  | Yes      |
| `PATH`                           | Path to upload folder                         | `string`  | Yes      |
| `CLEAR`                          | Clear bucket before deploy (default: `false`) | `boolean` | No       |

## Example

```yaml
name: Deploy to Yandex Cloud Object Storage

on:
    push:
        branches:
            - master

jobs:
    deploy:
        runs-on: ubuntu-latest
        strategy:
            matrix:
                node-version: [16.x]
        steps:
            - uses: actions/checkout@v3
            - uses: actions/setup-node@v3
              with:
                  node-version: ${{ matrix.node-version }}

            - name: Set up env
              run: cp .env.ci .env 
    
            - name: Install NPM dependencies
              run: npm ci
    
            - name: Build application
              run: npm run build
    
            - uses: sergeevpasha/yandex-cloud-s3-sync-github-actions@v0.1.0
              with:
                YANDEX_CLOUD_ACCESS_KEY_ID: ${{ secrets.YANDEX_CLOUD_ACCESS_KEY_ID }}
                YANDEX_CLOUD_SECRET_ACCESS_KEY: ${{ secrets.YANDEX_CLOUD_SECRET_ACCESS_KEY }}
                YANDEX_CLOUD_BUCKET_NAME: ${{ secrets.YANDEX_CLOUD_BUCKET_NAME }}
                PATH: "./dist"
                CLEAR: true

```
