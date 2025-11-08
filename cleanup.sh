#!/bin/bash

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}========================================${NC}"
echo -e "${YELLOW}   OT Security Dashboard 정리${NC}"
echo -e "${YELLOW}========================================${NC}"

# 컨테이너 중지 및 삭제
echo -e "${YELLOW}🛑 컨테이너 중지 및 삭제 중...${NC}"
docker-compose down -v

# Docker 이미지 삭제 확인
echo -e "${YELLOW}🗑️  Docker 이미지도 삭제하시겠습니까? (y/N)${NC}"
read -r response

if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
    echo -e "${YELLOW}🗑️  Docker 이미지 삭제 중...${NC}"
    
    # 프로젝트 이미지 삭제
    docker images | grep "ot-security" | awk '{print $3}' | xargs -r docker rmi -f
    docker images | grep "frontend" | awk '{print $3}' | xargs -r docker rmi -f
    docker images | grep "backend" | awk '{print $3}' | xargs -r docker rmi -f
    
    echo -e "${GREEN}✅ Docker 이미지 삭제 완료${NC}"
fi

# 볼륨 삭제 확인
echo -e "${YELLOW}🗑️  Elasticsearch 데이터(볼륨)도 삭제하시겠습니까? (y/N)${NC}"
read -r response

if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
    echo -e "${YELLOW}🗑️  볼륨 삭제 중...${NC}"
    docker volume rm $(docker volume ls -q | grep elasticsearch) 2>/dev/null
    echo -e "${GREEN}✅ 볼륨 삭제 완료${NC}"
fi

# 미사용 리소스 정리
echo -e "${YELLOW}🧹 미사용 Docker 리소스 정리 중...${NC}"
docker system prune -f

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}✅ 정리 완료!${NC}"
echo -e "${GREEN}========================================${NC}"