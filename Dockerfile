FROM  node:20.18.1
WORKDIR /app
EXPOSE 80
EXPOSE 443

ARG AWS_REGION
ARG AWS_ROLE_ARN
ARG OPEA_ROLE_ARN
ARG OPEA_ROLE_NAME
ARG OPEA_USER
ARG MODEL_ID
ARG INSTANCE_TYPE
ARG CLUSTER_NAME
ARG DISK_SIZE

ENV AWS_REGION=$AWS_REGION
ENV AWS_ROLE_ARN=$AWS_ROLE_ARN
ENV OPEA_ROLE_ARN=$OPEA_ROLE_ARN
ENV OPEA_ROLE_NAME=$OPEA_ROLE_NAME
ENV OPEA_USER=$OPEA_USER
ENV MODEL_ID=$MODEL_ID

ENV INSTANCE_TYPE=$INSTANCE_TYPE
ENV CLUSTER_NAME=$CLUSTER_NAME
ENV DISK_SIZE=$DISK_SIZE

RUN --mount=type=secret,id=aws-key-id,env=AWS_ACCESS_KEY_ID \
    --mount=type=secret,id=aws-secret-key,env=AWS_SECRET_ACCESS_KEY \
    --mount=type=secret,id=aws-session-token,env=AWS_SESSION_TOKEN \
    --mount=type=secret,id=aws-web-identity-token-file,env=AWS_WEB_IDENTITY_TOKEN_FILE \
    --mount=type=secret,id=hugging-face-token,env=HUGGING_FACE_TOKEN \
    --mount=type=secret,id=huggingfacehub-token,env=HUGGINGFACEHUB_TOKEN 

COPY . .
RUN npm install
RUN npm run build
RUN npm install -g aws-cdk
RUN rm -fr ./assets/GenaiExamples && git clone https://github.com/opea-project/GenAIExamples.git ./assets/GenaiExamples
RUN chmod +x "./lib/app/bin/marketplace/index.sh"

ENTRYPOINT ["./lib/app/bin/marketplace/index.sh"]

