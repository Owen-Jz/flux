# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e3]:
    - link "flux" [ref=e4] [cursor=pointer]:
      - /url: /
      - img [ref=e5]
      - generic [ref=e9]: flux
    - paragraph [ref=e10]: Welcome back
    - generic [ref=e11]:
      - button "Continue with Google" [ref=e12] [cursor=pointer]:
        - img [ref=e13]
        - text: Continue with Google
      - generic [ref=e22]: or continue with email
      - generic [ref=e23]:
        - generic [ref=e24]: Something went wrong. Please try again.
        - generic [ref=e25]:
          - img [ref=e26]
          - textbox "Email" [ref=e28]: test@example.com
        - generic [ref=e29]:
          - img [ref=e30]
          - textbox "Password" [ref=e32]: WrongPassword123!
          - button [ref=e33]:
            - img [ref=e34]
        - button "Sign in" [ref=e37] [cursor=pointer]:
          - text: Sign in
          - img [ref=e38]
        - link "Forgot password?" [ref=e41] [cursor=pointer]:
          - /url: /reset-password
      - paragraph [ref=e42]:
        - text: Don't have an account?
        - link "Sign up" [ref=e43] [cursor=pointer]:
          - /url: /signup
  - region "Notifications alt+T"
  - button "Open Next.js Dev Tools" [ref=e49] [cursor=pointer]:
    - img [ref=e50]
  - alert [ref=e53]
```