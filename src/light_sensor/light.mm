// light.mm
//
// clang -o light light.mm -F /Library/Developer/CommandLineTools/SDKs/MacOSX.sdk/System/Library/PrivateFrameworks -framework Foundation -framework IOKit -framework CoreFoundation -framework BezelServices

#include <mach/mach.h>
#import <Foundation/Foundation.h>
#import <IOKit/IOKitLib.h>
#import <IOKit/hidsystem/IOHIDServiceClient.h>

typedef struct __IOHIDEvent *IOHIDEventRef;

#define kAmbientLightSensorEvent 12

#define IOHIDEventFieldBase(type) (type << 16)

extern "C" {
  IOHIDEventRef IOHIDServiceClientCopyEvent(IOHIDServiceClientRef, int64_t, int32_t, int64_t);
  double IOHIDEventGetFloatValue(IOHIDEventRef, int32_t);

  IOHIDServiceClientRef ALCALSCopyALSServiceClient(void);
}

int main(void) {
  IOHIDServiceClientRef client = ALCALSCopyALSServiceClient();
  IOHIDEventRef event = IOHIDServiceClientCopyEvent(client, kAmbientLightSensorEvent, 0, 0);
  double value = IOHIDEventGetFloatValue(event, IOHIDEventFieldBase(kAmbientLightSensorEvent));
  printf("%d", (int)value); // units: lx

  CFRelease(event);
  exit(0);
}
