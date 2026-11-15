import { afterEach, test } from 'node:test';
import assert from 'node:assert/strict';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { LanguageSwitcher } from '../components/language-switcher';
import {
  I18nProvider, LANGUAGE_STORAGE_KEY, languageDirection, languageLocale,
  message, resolveMessage, useI18n, useLocalizedFormats,
} from './i18n';

const originalWindow = Object.getOwnPropertyDescriptor(globalThis, 'window');
afterEach(() => {
  if (originalWindow) Object.defineProperty(globalThis, 'window', originalWindow);
  else Reflect.deleteProperty(globalThis, 'window');
});

function storageReturning(value: string | null, blocked = false) {
  Object.defineProperty(globalThis, 'window', {
    configurable: true,
    value: { localStorage: { getItem: (key: string) => {
      assert.equal(key, LANGUAGE_STORAGE_KEY);
      if (blocked) throw new Error('Browser storage blocked');
      return value;
    } } },
  });
}

function LanguageLabel() {
  const { language, t } = useI18n();
  return createElement('span', { lang: language }, t('Add property', 'إضافة عقار'));
}

function DateLabel() {
  const { direction } = useI18n();
  const { formatDate } = useLocalizedFormats();
  return createElement('bdi', { dir: direction }, formatDate('2026-11-16'));
}

function renderProvider() {
  return renderToStaticMarkup(createElement(I18nProvider, {
    children: createElement(LanguageLabel),
  }));
}

test('Arabic and English have opposite document directions', () => {
  assert.equal(languageDirection('ar'), 'rtl');
  assert.equal(languageDirection('en'), 'ltr');
});

test('messages remain bilingual instead of storing a rendered translation', () => {
  const savedMessage = message('Unit saved.', 'تم حفظ الوحدة.');
  assert.equal(resolveMessage(savedMessage, 'ar'), 'تم حفظ الوحدة.');
  assert.equal(resolveMessage(savedMessage, 'en'), 'Unit saved.');
});

test('known authentication errors are localized but user data is not translated', () => {
  assert.equal(resolveMessage('Invalid login credentials', 'ar'), 'البريد أو كلمة المرور غير صحيحة.');
  assert.equal(resolveMessage('Property ALPHA / منزل 1', 'ar'), 'Property ALPHA / منزل 1');
});

test('Arabic dates keep Gregorian year, not a locale-default Hijri calendar', () => {
  for (const language of ['ar', 'en'] as const) {
    const formatter = new Intl.DateTimeFormat(languageLocale(language), {
      timeZone: 'UTC', year: 'numeric', month: '2-digit', day: '2-digit',
    });
    assert.equal(formatter.resolvedOptions().calendar, 'gregory');
    const parts = formatter.formatToParts(new Date('2026-02-28T12:00:00Z'));
    assert.equal(parts.find((part) => part.type === 'year')?.value, '2026');
    assert.equal(parts.find((part) => part.type === 'day')?.value, '28');
  }
});

test('formatted Arabic dates keep right-to-left direction while English stays left-to-right', () => {
  storageReturning('ar');
  assert.match(
    renderToStaticMarkup(createElement(I18nProvider, { children: createElement(DateLabel) })),
    /<bdi dir="rtl">16 نوفمبر 2026<\/bdi>/,
  );
  storageReturning('en');
  assert.match(
    renderToStaticMarkup(createElement(I18nProvider, { children: createElement(DateLabel) })),
    /<bdi dir="ltr">Nov 16, 2026<\/bdi>/,
  );
});

test('saved English preference renders English immediately', () => {
  storageReturning('en');
  assert.match(renderProvider(), /lang="en">Add property/);
});

test('saved Arabic preference renders Arabic immediately', () => {
  storageReturning('ar');
  assert.match(renderProvider(), /lang="ar">إضافة عقار/);
});

test('invalid or blocked preference storage does not crash the app', () => {
  storageReturning('invalid-language');
  assert.match(renderProvider(), /lang="ar"/);
  storageReturning(null, true);
  assert.match(renderProvider(), /lang="ar"/);
});

test('language selector exposes both options with selected state', () => {
  storageReturning('en');
  const markup = renderToStaticMarkup(createElement(I18nProvider, {
    children: createElement(LanguageSwitcher),
  }));
  assert.match(markup, /role="group"/);
  assert.match(markup, /data-testid="language-ar"[^>]*aria-pressed="false"/);
  assert.match(markup, /data-testid="language-en"[^>]*aria-pressed="true"/);
  assert.match(markup, /العربية/);
  assert.match(markup, /English/);
});
