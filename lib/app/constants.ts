export const HuggingFaceToken = process.env.HUGGING_FACE_TOKEN || process.env.HUGGINGFACEHUB_API_TOKEN || ""

const nginxOverride = {
    "chatqna-nginx-config": {
        data: {
            "default.conf": `  
                # Copyright (C) 2024 Intel Corporation
                # SPDX-License-Identifier: Apache-2.0

                server {
                    listen       80;
                    listen  [::]:80;

                    proxy_connect_timeout 600;
                    proxy_send_timeout 600;
                    proxy_read_timeout 600;
                    send_timeout 600;

                    client_max_body_size 10G;

                    location /home {
                        alias  /usr/share/nginx/html/index.html;
                    }

                    location / {
                        proxy_pass http://chatqna-chatqna-ui:5173;
                        proxy_set_header Host $host;
                        proxy_set_header X-Real-IP $remote_addr;
                        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
                        proxy_set_header X-Forwarded-Proto $scheme;
                    }

                    location /v1/chatqna {
                        proxy_pass http://chatqna:8888;
                        proxy_set_header Host $host;
                        proxy_set_header X-Real-IP $remote_addr;
                        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
                        proxy_set_header X-Forwarded-Proto $scheme;

                        proxy_buffering off;
                        proxy_cache off;
                        proxy_request_buffering off;
                        gzip off;
                    }

                    location /v1/dataprep {
                        proxy_pass http://chatqna-data-prep:6007;
                        proxy_set_header Host $host;
                        proxy_set_header X-Real-IP $remote_addr;
                        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
                        proxy_set_header X-Forwarded-Proto $scheme;
                    }

                    location /v1/dataprep/get_file {
                        proxy_pass http://chatqna-data-prep:6007;
                        proxy_set_header Host $host;
                        proxy_set_header X-Real-IP $remote_addr;
                        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
                        proxy_set_header X-Forwarded-Proto $scheme;
                    }

                    location /v1/dataprep/delete_file {
                        proxy_pass http://chatqna-data-prep:6007;
                        proxy_set_header Host $host;
                        proxy_set_header X-Real-IP $remote_addr;
                        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
                        proxy_set_header X-Forwarded-Proto $scheme;
                    }
                }`
        }
    }
}
export const chatOverrides = {
    "chatqna-retriever-usvc-config": {
        "data": {
            "HUGGINGFACEHUB_API_TOKEN": HuggingFaceToken
        }
    },
    "chatqna-data-prep-config": {
        "data": {
            "HUGGINGFACEHUB_API_TOKEN": HuggingFaceToken
        }
    },
    "chatqna-tgi-config": {
        "data": {
            "HF_TOKEN": HuggingFaceToken
        }
    },
    ...nginxOverride
}
export const guardrailOverrides = {
    "chatqna-retriever-usvc-config": {
        "data": {
            "HUGGINGFACEHUB_API_TOKEN": HuggingFaceToken
        }
    },
    "chatqna-guardrails-usvc-config": {
        "data": {
            "HUGGINGFACEHUB_API_TOKEN": HuggingFaceToken
        }
    },
    "chatqna-data-prep-config": {
        "data": {
            "HUGGINGFACEHUB_API_TOKEN": HuggingFaceToken
        }
    },
    "chatqna-tgi-guardrails-config": {
        "data": {
            "HF_TOKEN": HuggingFaceToken
        }
    },
    "chatqna-tgi-config": {
        "data": {
            "HF_TOKEN": HuggingFaceToken
        }
    },
    ...nginxOverride
}
export const opensearchOverrides = chatOverrides;
export const bedrockOverrides = {
    ...chatOverrides,
    "chatqna-bedrock-config": {
        "data": {
            MODEL_ID: process.env.BEDROCK_MODEL_ID || "us.anthropic.claude-3-haiku-20240307-v1:0"
           
        }
    }
}