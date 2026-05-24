package com.weini.security;

import io.jsonwebtoken.Claims;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

@Component
public class JwtAuthFilter extends OncePerRequestFilter {

  private static final Logger log = LoggerFactory.getLogger(JwtAuthFilter.class);

  private final JwtTokenProvider jwtTokenProvider;

  public JwtAuthFilter(JwtTokenProvider jwtTokenProvider) {
    this.jwtTokenProvider = jwtTokenProvider;
  }

  @Override
  protected boolean shouldNotFilterAsyncDispatch() {
    return false;
  }

  @Override
  protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response,
      FilterChain filterChain) throws ServletException, IOException {
    String token = extractToken(request);
    if (token != null && jwtTokenProvider.validateToken(token)) {
      Claims claims = jwtTokenProvider.parseToken(token);

      if ("refresh".equals(claims.get("type"))) {
        filterChain.doFilter(request, response);
        return;
      }

      UserPrincipal principal = new UserPrincipal(
          Long.parseLong(claims.getSubject()),
          claims.get("username", String.class),
          claims.get("role", String.class)
      );

      UsernamePasswordAuthenticationToken auth =
          new UsernamePasswordAuthenticationToken(principal, null,
              List.of(new SimpleGrantedAuthority("ROLE_" + principal.role())));

      SecurityContextHolder.getContext().setAuthentication(auth);
    }
    filterChain.doFilter(request, response);
  }

  private String extractToken(HttpServletRequest request) {
    String header = request.getHeader("Authorization");
    if (StringUtils.hasText(header) && header.startsWith("Bearer ")) {
      return header.substring(7);
    }
    return null;
  }
}
