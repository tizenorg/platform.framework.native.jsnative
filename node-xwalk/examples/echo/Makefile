CC=gcc
CFLAGS=-fPIC -I../../src
LDFLAGS=--shared

TARGET=libecho.so
SRCS=echo_extension.c

$(TARGET): $(SRCS)
	$(CC) $(CFLAGS) $(LDFLAGS) -o $@ $^

clean:
	rm -f $(TARGET)