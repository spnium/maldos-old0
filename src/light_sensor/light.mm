// lmutracker.mm
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

static double updateInterval = 0.1;
static IOHIDServiceClientRef client;
static IOHIDEventRef event;

void updateTimerCallBack(CFRunLoopTimerRef timer, void *info) {
  double value;

  event = IOHIDServiceClientCopyEvent(client, kAmbientLightSensorEvent, 0, 0);

  value = IOHIDEventGetFloatValue(event, IOHIDEventFieldBase(kAmbientLightSensorEvent));

  printf("\b\b\b\b\b\b\b\b\b\b\b\b\b\b\b\b\b%8f", value);

  CFRelease(event);
}

int main(void) {
  // kern_return_t kr;
  // CFRunLoopTimerRef updateTimer;

  // client = ALCALSCopyALSServiceClient();
  // if (client) {
  //   event = IOHIDServiceClientCopyEvent(client, kAmbientLightSensorEvent, 0, 0);
  // }
  // if (!event) {
  //   fprintf(stderr, "failed to find ambient light sensors\n");
  //   exit(1);
  // }

  // CFRelease(event);

  // setbuf(stdout, NULL);
  // printf("%8f", 0.0);

  // updateTimer = CFRunLoopTimerCreate(kCFAllocatorDefault,
  //                 CFAbsoluteTimeGetCurrent() + updateInterval, updateInterval,
  //                 0, 0, updateTimerCallBack, NULL);
  // CFRunLoopAddTimer(CFRunLoopGetCurrent(), updateTimer, kCFRunLoopDefaultMode);
  // CFRunLoopRun();

  // exit(0);

  double value;
  client = ALCALSCopyALSServiceClient();
  event = IOHIDServiceClientCopyEvent(client, kAmbientLightSensorEvent, 0, 0);
  value = IOHIDEventGetFloatValue(event, IOHIDEventFieldBase(kAmbientLightSensorEvent));
  printf("\b\b\b\b\b\b\b\b\b\b\b\b\b\b\b\b\b%8f", value); // units: lx

  CFRelease(event);
  exit(0);
}
