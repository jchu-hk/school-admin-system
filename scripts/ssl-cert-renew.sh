#!/bin/bash
# F-OPS-002 SSL证书到期自动续期脚本
# School Admin System - SSL Certificate Renewal
# 参考: SPEC-SYSTEM-DESIGN.md v1.7.0 Section 9.3

set -euo pipefail

# 环境变量配置
CERT_DOMAINS=${CERT_DOMAINS:-"school-admin.hk,api.school-admin.hk"}
CERT_THRESHOLD=${CERT_THRESHOLD:-30}  # 天
CERT_PROVIDER=${CERT_PROVIDER:-"certbot"}  # certbot | acme.sh
NGINX_CONTAINER=${NGINX_CONTAINER:-"nginx"}

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 输出日志函数
log_info() {
  echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
  echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
  echo -e "${RED}[ERROR]${NC} $1"
}

log_success() {
  echo -e "${GREEN}[SUCCESS]${NC} ✓ $1"
}

# 检查证书有效期
check_cert_expiry() {
  local domain=$1
  local port=${2:-443}
  
  log_info "检查证书: $domain (端口: $port)"
  
  # 获取证书信息
  local cert_info=$(openssl s_client -servername $domain -connect localhost:$port 2>/dev/null | openssl x509 -noout -dates 2>/dev/null || echo "failed")
  
  if [[ "$cert_info" == "failed" ]]; then
    log_error "无法获取证书信息: $domain"
    return 1
  fi
  
  # 解析过期时间
  local expiry_date=$(echo "$cert_info" | grep "notAfter" | cut -d= -f2)
  log_info "证书过期时间: $expiry_date"
  
  # 计算剩余天数
  local expiry_epoch=$(date -d "$expiry_date" +%s 2>/dev/null || date -j -f "%b %d %T %Y %Z" "$expiry_date" +%s)
  local current_epoch=$(date +%s)
  local days_remaining=$(( (expiry_epoch - current_epoch) / 86400 ))
  
  log_info "证书剩余有效期: ${days_remaining}天"
  
  return $days_remaining
}

# 执行证书续期
renew_cert() {
  local domain=$1
  
  log_info "开始续期证书: $domain"
  
  # 根据配置选择续期工具
  if [[ "$CERT_PROVIDER" == "certbot" ]]; then
    renew_with_certbot $domain
  elif [[ "$CERT_PROVIDER" == "acme.sh" ]]; then
    renew_with_acme $domain
  else
    log_error "未知的证书提供商: $CERT_PROVIDER"
    return 1
  fi
}

# 使用certbot续期
renew_with_certbot() {
  local domain=$1
  
  log_info "使用certbot续期..."
  
  # 检查certbot是否安装
  if ! command -v certbot >/dev/null 2>&1; then
    log_error "certbot未安装"
    log_info "安装certbot: apt-get install certbot"
    return 1
  fi
  
  # 执行续期
  if certbot renew --force-renewal --cert-name $domain 2>&1; then
    log_success "certbot续期成功: $domain"
    return 0
  else
    log_error "certbot续期失败: $domain"
    return 1
  fi
}

# 使用acme.sh续期
renew_with_acme() {
  local domain=$1
  
  log_info "使用acme.sh续期..."
  
  # 检查acme.sh是否安装
  if ! command -v acme.sh >/dev/null 2>&1; then
    log_error "acme.sh未安装"
    log_info "安装acme.sh: curl https://get.acme.sh | sh"
    return 1
  fi
  
  # 执行续期
  if acme.sh --renew -d $domain --force 2>&1; then
    log_success "acme.sh续期成功: $domain"
    return 0
  else
    log_error "acme.sh续期失败: $domain"
    return 1
  fi
}

# 重启nginx服务
restart_nginx() {
  log_info "重启nginx服务以应用新证书..."
  
  # 检查是否在docker环境
  if command -v docker >/dev/null 2>&1; then
    if docker ps | grep -q $NGINX_CONTAINER; then
      docker restart $NGINX_CONTAINER 2>&1 || log_warn "nginx重启失败"
      log_success "nginx容器已重启"
    else
      log_warn "nginx容器未运行"
    fi
  elif command -v systemctl >/dev/null 2>&1; then
    systemctl restart nginx 2>&1 || log_warn "nginx重启失败"
    log_success "nginx服务已重启"
  elif command -v nginx >/dev/null 2>&1; then
    nginx -s reload 2>&1 || log_warn "nginx reload失败"
    log_success "nginx已reload"
  else
    log_warn "未检测到nginx服务"
  fi
}

# 验证新证书
verify_new_cert() {
  local domain=$1
  
  log_info "验证新证书..."
  
  sleep 5  # 等待服务重启
  
  local days_remaining=0
  check_cert_expiry $domain
  days_remaining=$?
  
  if [[ $days_remaining -gt $CERT_THRESHOLD ]]; then
    log_success "新证书有效期正常: ${days_remaining}天"
    return 0
  else
    log_warn "新证书有效期仍较短: ${days_remaining}天"
    return 1
  fi
}

# 仅检查模式
check_only_mode() {
  log_info "=========================================="
  log_info "  SSL证书状态检查（仅检查模式）"
  log_info "=========================================="
  
  local needs_renewal=false
  
  # 检查所有域名
  for domain in ${CERT_DOMAINS//,/ }; do
    log_info ""
    log_info "检查域名: $domain"
    
    local days_remaining=0
    check_cert_expiry $domain 443
    days_remaining=$?
    
    if [[ $days_remaining -lt $CERT_THRESHOLD ]]; then
      log_warn "⚠️  证书即将过期: $domain (${days_remaining}天)"
      needs_renewal=true
    else
      log_success "证书状态正常: $domain (${days_remaining}天)"
    fi
  done
  
  echo ""
  if [[ $needs_renewal == true ]]; then
    log_warn "=========================================="
    log_warn "  有证书需要续期"
    log_warn "  执行续期: $0（不带--check-only）"
    log_warn "=========================================="
    return 1
  else
    log_success "=========================================="
    log_success "  所有证书状态正常"
    log_success "=========================================="
    return 0
  fi
}

# 记录续期执行
log_renewal_execution() {
  local domain=$1
  local result=$2
  local days_before=$3
  local days_after=$4
  
  local log_file="/workspace/projects/workspace/logs/ssl-renewal.log"
  mkdir -p $(dirname $log_file)
  
  cat <<EOF >> $log_file
[$(date -Iseconds)] SSL Certificate Renewal
- Domain: $domain
- Result: $result
- Days Before: $days_before
- Days After: $days_after
- Provider: $CERT_PROVIDER
- Executed By: $(whoami)
EOF
  
  log_info "续期记录已保存到: $log_file"
}

# 主执行函数
main() {
  echo ""
  echo "=========================================="
  echo "  School Admin System - SSL证书续期"
  echo "  F-OPS-002 Certificate Auto-Renewal"
  echo "=========================================="
  echo ""
  
  # 检查参数
  if [[ "$*" == *"--check-only"* ]]; then
    check_only_mode
    return $?
  fi
  
  local force_renewal=false
  if [[ "$*" == *"--force"* ]]; then
    force_renewal=true
    log_warn "⚠️  强制续期模式"
  fi
  
  # 检查并续期所有证书
  local renewal_count=0
  
  for domain in ${CERT_DOMAINS//,/ }; do
    log_info "处理域名: $domain"
    
    local days_remaining=0
    check_cert_expiry $domain 443
    days_remaining=$?
    
    # 判断是否需要续期
    if [[ $days_remaining -lt $CERT_THRESHOLD ]] || [[ $force_renewal == true ]]; then
      log_warn "证书需要续期: $domain (${days_remaining}天)"
      
      # 执行续期
      if renew_cert $domain; then
        renewal_count=$((renewal_count + 1))
        
        # 重启nginx
        restart_nginx
        
        # 验证新证书
        local new_days=0
        check_cert_expiry $domain 443
        new_days=$?
        
        # 记录执行
        log_renewal_execution $domain "success" $days_remaining $new_days
        
        log_success "证书续期完成: $domain"
      else
        log_error "证书续期失败: $domain"
        log_renewal_execution $domain "failed" $days_remaining 0
      fi
    else
      log_success "证书无需续期: $domain (${days_remaining}天)"
    fi
    
    echo ""
  done
  
  # 总结
  echo "=========================================="
  if [[ $renewal_count -gt 0 ]]; then
    log_success "续期完成！共续期 $renewal_count 个证书"
  else
    log_info "无需续期证书"
  fi
  echo "=========================================="
  echo ""
}

# 执行主函数
main "$@"