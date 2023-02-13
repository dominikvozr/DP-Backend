import org.junit.Test;
import static org.junit.Assert.*;

public class ExampleTest {

  @Test
  public void testAddition() {
    int result = 2 + 2;
    assertEquals(4, result);
  }

  @Test
  public void testSubtraction() {
    int result = 5 - 3;
    assertEquals(2, result);
  }

  @Test
  public void testMultiplication() {
    int result = 4 * 3;
    assertEquals(12, result);
  }

  @Test
  public void testDivision() {
    int result = 10 / 2;
    assertEquals(5, result);
  }

}