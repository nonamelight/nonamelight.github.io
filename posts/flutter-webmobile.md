# Flutter로 Web과 Mobile 동시 개발하기

Flutter는 하나의 코드베이스로 iOS, Android, Web, Desktop을 동시에 타겟할 수 있는 강력한 프레임워크입니다.

## 왜 Flutter인가?

- **단일 코드베이스**: 한 번 작성으로 여러 플랫폼 지원
- **빠른 개발**: Hot Reload로 UI 즉각 반영
- **네이티브 성능**: Dart → 네이티브 코드 컴파일
- **풍부한 위젯**: Material, Cupertino 디자인 시스템 기본 제공

## Web과 Mobile 동시 구현 시 주의사항

### 1. 반응형 레이아웃

```dart
Widget build(BuildContext context) {
  final isWide = MediaQuery.of(context).size.width > 768;
  
  return isWide
    ? Row(children: [...])    // 웹: 좌우 레이아웃
    : Column(children: [...]);  // 모바일: 상하 레이아웃
}
```

### 2. 플랫폼 분기

```dart
import 'package:flutter/foundation.dart' show kIsWeb;

if (kIsWeb) {
  // 웹 전용 로직
} else {
  // 모바일 전용 로직
}
```

### 3. 블루투스 등 Native 기능

Flutter 패키지가 Web을 지원하지 않는 경우, **플랫폼 채널(Platform Channel)**을 사용합니다.

```dart
// Flutter → Android/iOS 네이티브 코드 호출
final bluetoothChannel = MethodChannel('bluetooth_channel');
final result = await bluetoothChannel.invokeMethod('scanDevices');
```

## 배포

- **웹**: `flutter build web` → Nginx로 정적 파일 서빙
- **iOS**: `flutter build ipa` → App Store Connect 업로드
- **Android**: `flutter build appbundle` → Google Play Console 업로드

## 결론

바이오톡스텍의 복지마일리지 사이트, IACUC 동물윤리승인 시스템 모두 Flutter Web으로 구현하여 별도의 웹 프레임워크 없이 일관된 UI/UX를 제공하고 있습니다.

> 하나의 언어, 하나의 프레임워크로 전체 플랫폼을 커버하는 생산성은 소규모 팀에서 특히 강력합니다.
