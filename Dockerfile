FROM node:20-alpine AS frontend-build
WORKDIR /app/client
COPY client/package*.json ./
RUN npm ci
COPY client/ ./
RUN npm run build

FROM node:20-alpine
WORKDIR /app
COPY server/package*.json ./
RUN npm ci --omit=dev
COPY server/ ./
COPY --from=frontend-build /app/client/dist ./public

ENV NODE_ENV=production
ENV PORT=3001
EXPOSE 3001

RUN mkdir -p /app/data /app/uploads

CMD ["sh", "-c", "node seed.js 2>/dev/null; node index.js"]
