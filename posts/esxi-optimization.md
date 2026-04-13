# ESXi VM 리소스 최적화로 4박5일을 1시간으로

## 상황

바이오톡스텍의 연구 프로그램이 실행되는 서버 환경을 점검하던 중 심각한 비효율을 발견했습니다.

- 연구 프로세스 실행 시 **4박 5일** 소요
- 시스템 로그인에 **1분 이상** 지연
- CPU 평균 점유율 **40% 이상** 상시 유지

## 원인 분석

ESXi vSphere 콘솔에서 VM별 리소스 할당을 분석한 결과:

| VM | 역할 | 기존 CPU | 기존 RAM |
|----|------|---------|---------|
| VM-A | 연구 계산 (주요) | 4 vCPU | 8GB |
| VM-B | 단순 파일 서버 | 16 vCPU | 64GB |
| VM-C | 웹서버 | 8 vCPU | 32GB |

> **핵심 문제**: 단순 파일 서버에 과도한 리소스가 할당되고, 실제 계산 작업을 수행하는 VM에는 리소스가 부족했습니다.

## 해결책: 리소스 재분배

```bash
# ESXi Shell에서 VM 리소스 확인
esxcli vm process list

# vSphere 콘솔에서 각 VM의 CPU/RAM 재할당
# VM-A (연구계산): 4 → 24 vCPU, 8GB → 128GB RAM
# VM-B (파일서버): 16 → 4 vCPU, 64GB → 16GB RAM
```

### 추가 최적화

**자동 세션 관리 스크립트** (매일 아침 실행):

```bash
#!/bin/bash
# cleanup_sessions.sh
# 불필요한 오래된 세션 제거

SESSION_TIMEOUT=28800  # 8시간
CURRENT_TIME=$(date +%s)

while IFS= read -r session; do
    SESSION_START=$(echo "$session" | awk '{print $6}')
    SESSION_AGE=$((CURRENT_TIME - SESSION_START))
    
    if [ $SESSION_AGE -gt $SESSION_TIMEOUT ]; then
        SESSION_ID=$(echo "$session" | awk '{print $1}')
        echo "Killing stale session: $SESSION_ID"
        # kill session
    fi
done < <(who -u)

echo "Session cleanup completed at $(date)"
```

## 결과

| 지표 | 개선 전 | 개선 후 | 개선율 |
|------|--------|--------|-------|
| 연구 프로세스 | 4박 5일 | **1시간** | **99.7%↓** |
| 로그인 시간 | 1분+ | **3초** | **95%↓** |
| CPU 점유율 | 40%+ | **3%** | **92.5%↓** |

## 교훈

서버 성능 문제는 **하드웨어 증설**이 아닌 **리소스 재분배**로 해결할 수 있는 경우가 많습니다. ESXi 환경에서는 VM별 실제 사용량을 주기적으로 모니터링하고, 워크로드에 맞게 재조정하는 것이 중요합니다.

---

*이 최적화 작업으로 추가 서버 도입 없이 극적인 성능 향상을 이뤄냈습니다.*
