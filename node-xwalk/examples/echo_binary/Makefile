CC=gcc
CFLAGS=-fPIC -I../../src
LDFLAGS=--shared

TARGET=libecho2.so
SRCS=echo_extension_messaging_2.c

$(TARGET): $(SRCS)
	$(CC) $(CFLAGS) $(LDFLAGS) -o $@ $^

clean:
	rm -f $(TARGET)