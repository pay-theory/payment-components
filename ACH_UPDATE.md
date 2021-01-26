# Pay Theory Web SDK: ACH Update

### ACH Payments are now possible

There are 4 fields required for ACH
- Account Name
- Account Number
- Bank Code
    - Also known as routing number
- Account Type
    - Either Checking or Savings

```html
<form>
...
<div id="pay-theory-ach-account-name"></div>
<div id="pay-theory-ach-account-number"></div>
<div id="pay-theory-ach-account-type"></div>
<div id="pay-theory-ach-bank-code"></div>
...
</form>
```

Mount functions and event listeners work the same as before

To display both Card and ACH on the same page make sure only one is visible at a time and the other is wrapped by a parent element whose css is set to ``` display:none ```