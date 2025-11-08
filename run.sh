#!/bin/bash

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}   OT Security Dashboard 시작${NC}"
echo -e "${GREEN}========================================${NC}"

# Docker 및 Docker Compose 확인
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker가 설치되어 있지 않습니다.${NC}"
    exit 1
fi

if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    echo -e "${RED}❌ Docker Compose가 설치되어 있지 않습니다.${NC}"
    exit 1
fi

# .env 파일 확인
if [ ! -f .env ]; then
    echo -e "${YELLOW}⚠️  .env 파일이 없습니다. 기본 설정으로 진행합니다.${NC}"
fi

# 이전 컨테이너 정리
echo -e "${YELLOW}🧹 이전 컨테이너 정리 중...${NC}"
docker-compose down -v

# Docker 이미지 빌드 및 컨테이너 시작
echo -e "${GREEN}🔨 Docker 이미지 빌드 및 컨테이너 시작 중...${NC}"
docker-compose up -d --build

# 서비스 상태 확인
echo -e "${YELLOW}⏳ 서비스 시작 대기 중...${NC}"
sleep 10

# Elasticsearch 상태 확인
echo -e "${YELLOW}📊 Elasticsearch 상태 확인 중...${NC}"
for i in {1..30}; do
    if curl -s http://localhost:9200/_cluster/health > /dev/null; then
        echo -e "${GREEN}✅ Elasticsearch 준비 완료${NC}"
        break
    fi
    echo -e "${YELLOW}   대기 중... ($i/30)${NC}"
    sleep 2
done

# Backend 상태 확인
echo -e "${YELLOW}🔧 Backend 상태 확인 중...${NC}"
for i in {1..30}; do
    if curl -s http://localhost:8080/actuator/health > /dev/null; then
        echo -e "${GREEN}✅ Backend 준비 완료${NC}"
        break
    fi
    echo -e "${YELLOW}   대기 중... ($i/30)${NC}"
    sleep 2
done

# Frontend 상태 확인
echo -e "${YELLOW}🎨 Frontend 상태 확인 중...${NC}"
for i in {1..30}; do
    if curl -s http://localhost:5173 > /dev/null; then
        echo -e "${GREEN}✅ Frontend 준비 완료${NC}"
        break
    fi
    echo -e "${YELLOW}   대기 중... ($i/30)${NC}"
    sleep 2
done

# 완료 메시지
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}✅ 모든 서비스가 실행되었습니다!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "${GREEN}📍 접속 정보:${NC}"
echo -e "   Frontend:      ${YELLOW}http://localhost:5173${NC}"
echo -e "   Backend API:   ${YELLOW}http://localhost:8080/api${NC}"
echo -e "   API Docs:      ${YELLOW}http://localhost:8080/swagger-ui/index.html${NC}"
echo -e "   Elasticsearch: ${YELLOW}http://localhost:9200${NC}"
echo -e "   Actuator:      ${YELLOW}http://localhost:8080/actuator/health${NC}"
echo ""
echo -e "${GREEN}📝 유용한 명령어:${NC}"
echo -e "   로그 보기:     ${YELLOW}docker-compose logs -f${NC}"
echo -e "   특정 로그:     ${YELLOW}docker-compose logs -f [frontend|backend|elasticsearch]${NC}"
echo -e "   중지:          ${YELLOW}docker-compose down${NC}"
echo -e "   재시작:        ${YELLOW}docker-compose restart${NC}"
echo ""