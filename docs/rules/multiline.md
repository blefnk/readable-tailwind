# readable-tailwind/multiline

💼⚠️ This rule is enabled in the ![error](https://github.com/schoero/eslint-plugin-readable-tailwind/blob/main/assets/checkmark-error.svg) `error` config. This rule _warns_ in the ![warning](https://github.com/schoero/eslint-plugin-readable-tailwind/blob/main/assets/checkmark-warning.svg) `warning` config.

🔧 This rule is automatically fixable by the [`--fix` CLI option](https://eslint.org/docs/latest/user-guide/command-line-interface#--fix).

<!-- end auto-generated rule header -->

<br/>

## Description

Enforce tailwind classes to be broken up into multiple lines. It is possible to break at a certain print width or a certain number of classes per line.

<br/>

## Examples

With the default options, a class name will be broken up into multiple lines and grouped by their modifiers. Groups are separated by an empty line.  

The following examples show how the rule behaves with different options:

```tsx
// ❌ BAD
<div class="text-black underline focus:font-bold focus:text-opacity-70 hover:font-bold hover:text-opacity-70" />;
```

```tsx
// ✅ GOOD: with option { group: 'emptyLine' }
<div class={`
  text-black underline

  focus:font-bold focus:text-opacity-70

  hover:font-bold hover:text-opacity-70
`} />;
```

```tsx
// ✅ GOOD: with option { group: 'newLine' }
<div class={`
  text-black underline
  focus:font-bold focus:text-opacity-70
  hover:font-bold hover:text-opacity-70
`} />;
```

```tsx
// ✅ GOOD: with option { group: 'never', printWidth: 80 }
<div class={`
  text-black underline focus:font-bold focus:text-opacity-70 hover:font-bold
  hover:text-opacity-70
`} />;
```

```tsx
// ✅ GOOD: with { classesPerLine: 1, group: 'emptyLine' }
<div class={`
  text-black
  underline

  focus:font-bold
  focus:text-opacity-70

  hover:font-bold
  hover:text-opacity-70
`} />;
```

<br/>

## Options

<!-- begin auto-generated rule options list -->

| Name              | Description                                                                                                                                                   | Type     | Choices                         | Default                           |
| :---------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------ | :------- | :------------------------------ | :-------------------------------- |
| `callees`         | List of function names whose arguments should also be considered.                                                                                             | String[] |                                 | [`clsx`, `cva`, `ctl`, `twMerge`] |
| `classAttributes` | The name of the attribute that contains the tailwind classes.                                                                                                 | String[] |                                 | [`class`, `className`]            |
| `classesPerLine`  | The maximum amount of classes per line. Lines are wrapped appropriately to stay within this limit . The value `0` disables line wrapping by `classesPerLine`. | Integer  |                                 | `0`                               |
| `group`           | The group separator.                                                                                                                                          | String   | `emptyLine`, `never`, `newLine` | `emptyLine`                       |
| `indent`          | Determines how the code should be indented.                                                                                                                   | Integer  |                                 | `2`                               |
| `printWidth`      | The maximum line length. Lines are wrapped appropriately to stay within this limit. The value `0` disables line wrapping by `printWidth`.                     | Integer  |                                 | `80`                              |

<!-- end auto-generated rule options list -->
