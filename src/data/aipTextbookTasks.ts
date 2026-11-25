import {TaskCard} from '../types/study';

/**
 * Практические задания и решения на C++17 из учебного пособия Г. С. Ивановой и Т. Н. Ничушкиной (2026)
 * Покрывают Главы 3–8 и примеры рубежного контроля Модулей 1 и 2.
 */
export const AIP_TEXTBOOK_TASKS: TaskCard[] = [
  {
    id: 'aip-tb-rk1-1',
    kind: 'exam',
    badgeNumber: 'РК 1 · Зад. 1',
    title: 'Вычисление цепной дроби x(x² + 2/(x² + 4/(… + 256/x²)))',
    chapter: 'Учебник C++ · РК Модуль 1',
    problemStatement:
      'Дано действительное x ≠ 0. Вычислите значение цепной дроби: x(x² + 2/(x² + 4/(x² + 8/(…(x² + 256/x²)))…)).',
    algorithmSummary:
      'Сворачиваем дробь снизу вверх (изнутри наружу): инициализируем знаменатель d = x*x, затем в цикле по k = 256, 128, …, 2 (k /= 2) пересчитываем d = x*x + k / d, и в конце умножаем d на x.',
    explanationSteps: [
      {
        title: '1. Проверка ОДЗ',
        detail: 'При x == 0 возникает деление на ноль в самом нижнем знаменателе x², поэтому сначала проверяем x != 0.',
      },
      {
        title: '2. Обратный проход по степеням двойки',
        detail: 'Начинаем с d = x*x и делим k пополам от 256 до 2: на каждом шаге d = x*x + k/d. После цикла получаем всю скобку и умножаем на x.',
      },
    ],
    code: `#include <iostream>
using namespace std;

int main() {
    double x;
    cin >> x;
    if (x != 0) {
        double d = x * x;
        for (int k = 256; k >= 2; k /= 2) {
            d = x * x + k / d;
        }
        cout << x * d << endl;
    } else {
        cout << "Ошибка: деление на ноль\\n";
    }
    return 0;
}`,
    expectedOutput: `Вход: 1
Выход: 2.00142`,
    slides: [
      {
        lectureId: 'aip_cpp_textbook',
        page: 47,
        label: 'Учебник C++ · РК Модуль 1, задание 1 (стр. 47)',
        isAnswerSlide: true,
      },
    ],
  },
  {
    id: 'aip-tb-rk1-2',
    kind: 'exam',
    badgeNumber: 'РК 1 · Зад. 2',
    title: 'Все простые числа на отрезке [a, b]',
    chapter: 'Учебник C++ · РК Модуль 1',
    problemStatement:
      'Даны натуральные числа a, b (a ≤ b). Получите все простые числа p, удовлетворяющие условию a ≤ p ≤ b, и выведите их на экран. Если таких чисел нет, выдайте сообщение.',
    algorithmSummary:
      'Перебираем p от a до b; для каждого p > 1 проверяем делители d от 2 до √p (условие d <= p / d без переполнения) с досрочным выходом при первом делителе.',
    explanationSteps: [
      {
        title: '1. Поисковый цикл до √p',
        detail: 'Используем целочисленное условие d <= p / d вместо d*d <= p или sqrt(p), чтобы избежать переполнения и ошибок округления.',
      },
      {
        title: '2. Флаг найденного результата',
        detail: 'Заводим bool found = false; если ни одного простого числа не выведено, печатаем «Простых чисел нет».',
      },
    ],
    code: `#include <iostream>
using namespace std;

int main() {
    int a, b;
    cin >> a >> b;
    bool found = false;
    for (long long p = a; p <= b; p++) {
        bool prime = p > 1;
        for (long long d = 2; prime && d <= p / d; d++) {
            if (p % d == 0) prime = false;
        }
        if (prime) {
            cout << p << ' ';
            found = true;
        }
    }
    if (!found) cout << "Простых чисел нет";
    return 0;
}`,
    expectedOutput: `Вход: 10 25
Выход: 11 13 17 19 23`,
    slides: [
      {
        lectureId: 'aip_cpp_textbook',
        page: 47,
        label: 'Учебник C++ · РК Модуль 1, задание 2 (стр. 47)',
        isAnswerSlide: true,
      },
    ],
  },
  {
    id: 'aip-tb-ch3-series',
    kind: 'exam',
    badgeNumber: 'Гл. 3 · №4–5',
    title: 'Вычисление arctg(x) с точностью ε = 10⁻³, 10⁻⁴ через рекуррентный член ряда',
    chapter: 'Учебник C++ · Глава 3 (Циклы)',
    problemStatement:
      'Разработайте программу вычисления arctg x = x − x³/3 + x⁵/5 − x⁷/7 + … при заданном x (|x| ≤ 1) с точностью ε = 10⁻³ и 10⁻⁴. Оцените число итераций.',
    algorithmSummary:
      'Суммируем знакочередующийся ряд, вычисляя каждый следующий член по предыдущему: t_{k+1} = −t_k · x² · (2k+1)/(2k+3), пока |t| > ε. При x = 1 потребуется 500 и 5000 членов.',
    explanationSteps: [
      {
        title: '1. Проверка области сходимости',
        detail: 'Ряд Тейлора для arctg(x) сходится только при |x| ≤ 1 — обязательно проверяем fabs(x) > 1.',
      },
      {
        title: '2. Рекуррентный пересчёт без pow()',
        detail: 'Вместо медленного pow(x, 2k+1) умножаем предыдущий член t на -x*x*(2*k+1)/(2*k+3).',
      },
    ],
    code: `#include <iostream>
#include <cmath>
using namespace std;

int main() {
    double x;
    cin >> x;
    if (fabs(x) > 1) {
        cout << "Ряд неприменим\\n";
    } else {
        for (double eps : {1e-3, 1e-4}) {
            double sum = 0, t = x;
            int k = 0;
            while (fabs(t) > eps) {
                sum += t;
                t *= -x * x * (2 * k + 1) / (2 * k + 3);
                k++;
            }
            cout << "eps=" << eps << " sum=" << sum << " iter=" << k << endl;
        }
    }
    return 0;
}`,
    expectedOutput: `Вход: 1
eps=0.001 sum=0.784898 iter=500
eps=0.0001 sum=0.785348 iter=5000`,
    slides: [
      {
        lectureId: 'aip_cpp_textbook',
        page: 14,
        label: 'Учебник C++ · Глава 3, задание 5 (стр. 14–15)',
        isAnswerSlide: true,
      },
    ],
  },
  {
    id: 'aip-tb-ch3-curve',
    kind: 'exam',
    badgeNumber: 'Гл. 3 · №7 & 9',
    title: 'Длина кривой y = x^(3/2) на [0, 4] методом удвоения хорд + вложенные корни',
    chapter: 'Учебник C++ · Глава 3 (Циклы)',
    problemStatement:
      'Вычислите длину дуги кривой y = x^(3/2) на [0, 4] с точностью 10⁻³, 10⁻⁴ (удвоением числа хорд) и оцените число итераций.',
    algorithmSummary:
      'На каждом шаге удваиваем число разбиений n = 1, 2, 4, … и суммируем длины хорд hypot(h, y2 - y1), пока |s - old| > eps. Точное значение (8/27)(10√10 − 1) ≈ 9.0734.',
    explanationSteps: [
      {
        title: '1. Аппроксимация ломаной',
        detail: 'Шаг h = 4.0 / n; длина i-й хорды равна hypot(h, y((i+1)h) - y(ih)).',
      },
      {
        title: '2. Критерий остановки по соседним приближениям',
        detail: 'Цикл do-while выполняется, пока it == 1 || fabs(s - old) > eps. Для 10⁻³ — 7 итераций (64 хорды), для 10⁻⁴ — 9 итераций (256 хорд).',
      },
    ],
    code: `#include <iostream>
#include <cmath>
using namespace std;

int main() {
    for (double eps : {1e-3, 1e-4}) {
        double old = 0, s = 0;
        int n = 1, it = 0;
        do {
            old = s; s = 0;
            double h = 4.0 / n;
            for (int i = 0; i < n; i++) {
                double y1 = pow(i * h, 1.5);
                double y2 = pow((i + 1) * h, 1.5);
                s += hypot(h, y2 - y1);
            }
            it++; n *= 2;
        } while (it == 1 || fabs(s - old) > eps);
        cout << s << " итераций: " << it << endl;
    }
    // Вложенные корни sqrt(3 + sqrt(6 + ... + sqrt(63))):
    double r = 0;
    for (int i = 63; i >= 3; i -= 3) r = sqrt(i + r);
    cout << "Вложенные корни: " << r << endl;
    return 0;
}`,
    expectedOutput: `9.07305 итераций: 7
9.07339 итераций: 9`,
    slides: [
      {
        lectureId: 'aip_cpp_textbook',
        page: 15,
        label: 'Учебник C++ · Глава 3, задание 7 (стр. 15–16)',
        isAnswerSlide: true,
      },
      {
        lectureId: 'aip_cpp_textbook',
        page: 16,
        label: 'Учебник C++ · Вложенные корни, задание 9 (стр. 16)',
      },
    ],
  },
  {
    id: 'aip-tb-ch4-str',
    kind: 'exam',
    badgeNumber: 'Гл. 4 · №16',
    title: 'Сжатие групп звёздочек «*» в C-строке на месте (in-place)',
    chapter: 'Учебник C++ · Глава 4 (Строки)',
    problemStatement:
      'Введите с клавиатуры строку длиной ≤ 80 символов, содержащую латинские буквы и группы символов «*». Удалите лишние звёздочки в каждой группе, оставив ровно по одной.',
    algorithmSummary:
      'Два индекса i (чтение) и j (запись): переписываем s[i] в s[j++], только если s[i] != \'*\' или это первая звёздочка (i == 0 || s[i-1] != \'*\'). В конце ставим \'\\0\'.',
    explanationSteps: [
      {
        title: '1. Безопасный ввод C-строки',
        detail: 'Выделяем буфер char s[81] (80 символов + нулевой байт \'\\0\') и читаем через cin.getline(s, 81).',
      },
      {
        title: '2. Запись на месте за O(n)',
        detail: 'Индекс j никогда не обгоняет i, поэтому можно перезаписывать исходный массив без выделения дополнительной памяти.',
      },
    ],
    code: `#include <iostream>
using namespace std;

int main() {
    char s[81];
    cin.getline(s, 81);
    int j = 0;
    for (int i = 0; s[i] != '\\0'; i++) {
        if (s[i] != '*' || i == 0 || s[i - 1] != '*') {
            s[j++] = s[i];
        }
    }
    s[j] = '\\0';
    cout << s << endl;
    return 0;
}`,
    expectedOutput: `Вход: ab***cd*e****f
Выход: ab*cd*e*f`,
    slides: [
      {
        lectureId: 'aip_cpp_textbook',
        page: 22,
        label: 'Учебник C++ · Глава 4, задание 16 (стр. 22)',
        isAnswerSlide: true,
      },
    ],
  },
  {
    id: 'aip-tb-ch4-union',
    kind: 'exam',
    badgeNumber: 'Гл. 4 · №20',
    title: 'Структура с признаком варианта и объединением (`union` СМС / Email)',
    chapter: 'Учебник C++ · Глава 4 (Структуры и union)',
    problemStatement:
      'Создайте список сотрудников фирмы с указанием способа быстрой связи (СМС или Email) и соответствующего контакта (телефон или почта) в объединении. Выведите телефоны сотрудников для СМС и их количество.',
    algorithmSummary:
      'В структуре Employee храним булевый ключ `bool sms` и `union { char phone[24]; char email[100]; } contact;`. Читаем и выводим только активное поле объединения согласно ключу.',
    explanationSteps: [
      {
        title: '1. Запись с признаком варианта (tagged union)',
        detail: 'Все поля union делят одну область памяти, поэтому обязателен внешний тег `bool sms`, указывающий, какое поле сейчас валидно.',
      },
      {
        title: '2. Фильтрация и подсчёт',
        detail: 'В цикле по массиву сотрудников печатаем `e.contact.phone` только при `e.sms == true` и увеличиваем счётчик `k`.',
      },
    ],
    code: `#include <iostream>
#include <vector>
using namespace std;

struct Employee {
    char name[80];
    bool sms;
    union { char phone[24]; char email[100]; } contact;
};

int main() {
    int n; cin >> n;
    vector<Employee> a(n);
    for (auto &e : a) {
        cin >> ws; cin.getline(e.name, 80);
        cin >> e.sms >> ws;
        if (e.sms) cin.getline(e.contact.phone, 24);
        else cin.getline(e.contact.email, 100);
    }
    int k = 0;
    for (const auto &e : a) {
        if (e.sms) { cout << e.contact.phone << endl; k++; }
    }
    cout << "Количество: " << k << endl;
    return 0;
}`,
    expectedOutput: `+7-999-111-22-33
Количество: 1`,
    slides: [
      {
        lectureId: 'aip_cpp_textbook',
        page: 24,
        label: 'Учебник C++ · Глава 4, задание 20 (стр. 24)',
        isAnswerSlide: true,
      },
    ],
  },
  {
    id: 'aip-tb-rk2-1',
    kind: 'exam',
    badgeNumber: 'РК 2 · Зад. 1',
    title: 'Обмен максимальных элементов главной и побочной диагоналей матрицы',
    chapter: 'Учебник C++ · РК Модуль 2',
    problemStatement:
      'Введите целочисленную квадратную матрицу порядка n. В отдельной подпрограмме найдите наибольшие элементы на главной и побочной диагоналях и поменяйте их местами. Выведите матрицу до и после.',
    algorithmSummary:
      'Передаём матрицу по ссылке в `change(vector<vector<int>>& a)`: за один проход `i = 1..n-1` находим индексы максимума на главной (`a[i][i]`) и побочной (`a[i][n-1-i]`) диагоналях и вызываем `swap`.',
    explanationSteps: [
      {
        title: '1. Индексы диагоналей',
        detail: 'Элемент главной диагонали в строке i: a[i][i]. Элемент побочной диагонали: a[i][n - 1 - i].',
      },
      {
        title: '2. Передача по ссылке и вывод в main()',
        detail: 'Подпрограмма change меняет матрицу на месте, а print принимает const-ссылку, чтобы избежать лишнего копирования.',
      },
    ],
    code: `#include <iostream>
#include <vector>
#include <utility>
using namespace std;

void change(vector<vector<int>>& a) {
    int n = a.size(), i1 = 0, i2 = 0;
    for (int i = 1; i < n; i++) {
        if (a[i][i] > a[i1][i1]) i1 = i;
        if (a[i][n - 1 - i] > a[i2][n - 1 - i2]) i2 = i;
    }
    swap(a[i1][i1], a[i2][n - 1 - i2]);
}

void print(const vector<vector<int>>& a) {
    for (const auto &r : a) {
        for (int x : r) cout << x << ' ';
        cout << endl;
    }
}`,
    expectedOutput: `До:  1 9 / 4 5
После: 1 5 / 4 9`,
    slides: [
      {
        lectureId: 'aip_cpp_textbook',
        page: 48,
        label: 'Учебник C++ · РК Модуль 2, задание 1 (стр. 48)',
        isAnswerSlide: true,
      },
    ],
  },
  {
    id: 'aip-tb-rk2-2',
    kind: 'exam',
    badgeNumber: 'РК 2 · Зад. 2',
    title: 'Удаление всех строк матрицы, содержащих минимальный элемент',
    chapter: 'Учебник C++ · РК Модуль 2',
    problemStatement:
      'Введите матрицу вещественных чисел n × m. Выделив подпрограмму, удалите все строки, содержащие минимальный элемент матрицы. Выведите исходную и преобразованную матрицы.',
    algorithmSummary:
      'Сначала за один проход находим глобальный минимум `mn`, затем идиомой erase-remove (`a.erase(remove_if(...), a.end())`) удаляем каждую строку, где `find` находит `mn`.',
    explanationSteps: [
      {
        title: '1. Поиск точного минимума',
        detail: 'Инициализируем mn = a[0][0] и сравниваем со всеми элементами. Так как mn скопирован прямо из массива, точное сравнение `find(..., mn)` работает корректно даже для double.',
      },
      {
        title: '2. Идиома erase-remove',
        detail: 'Алгоритм `remove_if` сдвигает сохраняемые строки в начало вектора, а `erase` обрезает хвост за O(n·m).',
      },
    ],
    code: `#include <iostream>
#include <vector>
#include <algorithm>
using namespace std;

void removeMinRows(vector<vector<double>>& a) {
    if (a.empty() || a[0].empty()) return;
    double mn = a[0][0];
    for (const auto &r : a)
        for (double x : r) mn = min(mn, x);
    a.erase(remove_if(a.begin(), a.end(), [mn](const auto &r) {
        return find(r.begin(), r.end(), mn) != r.end();
    }), a.end());
}`,
    expectedOutput: `Удалены все строки, содержащие глобальный минимум матрицы`,
    slides: [
      {
        lectureId: 'aip_cpp_textbook',
        page: 48,
        label: 'Учебник C++ · РК Модуль 2, задание 2 (стр. 48–49)',
        isAnswerSlide: true,
      },
    ],
  },
  {
    id: 'aip-tb-ch5-chord',
    kind: 'exam',
    badgeNumber: 'Гл. 5 · №8 & 17',
    title: 'Поиск корня методом хорд через указатель на функцию + быстрая рекурсивная степень',
    chapter: 'Учебник C++ · Глава 5 (Подпрограммы и рекурсия)',
    problemStatement:
      'Напишите универсальную подпрограмму поиска корня любой непрерывной функции на [a, b] методом хорд (передавая функцию указателем), а также рекурсивную функцию возведения числа в целую степень.',
    algorithmSummary:
      'Функция `root(double (*f)(double), a, b, eps)` на каждом шаге вычисляет хорду x = a − f(a)(b−a)/(f(b)−f(a)) и сжимает отрезок со сменой знака. Быстрая степень делит показатель n пополам (O(log n)).',
    explanationSteps: [
      {
        title: '1. Указатель на функцию',
        detail: 'Параметр `double (*f)(double)` позволяет передавать в `root` любую функцию одной вещественной переменной.',
      },
      {
        title: '2. Рекурсивное возведение в степень',
        detail: 'Базис: n == 0 → 1. Отрицательная степень: 1 / power(a, -n). Деление n/2 ускоряет вычисление с O(n) до O(log n).',
      },
    ],
    code: `#include <cmath>
double root(double (*f)(double), double a, double b, double eps) {
    if (fabs(f(a)) <= eps) return a;
    if (fabs(f(b)) <= eps) return b;
    for (int i = 0; i < 100000; i++) {
        double fa = f(a), fb = f(b);
        if (fa == fb) break;
        double x = a - fa * (b - a) / (fb - fa), fx = f(x);
        if (fabs(fx) <= eps) return x;
        if ((fa < 0) == (fx < 0)) a = x; else b = x;
    }
    return NAN;
}

double power(double a, long long n) {
    if (n == 0) return 1;
    if (n < 0) return 1 / power(a, -n);
    double t = power(a, n / 2);
    return n % 2 ? a * t * t : t * t;
}`,
    expectedOutput: `root(x^2 - 2, 1, 2, 1e-8) ≈ 1.41421356
power(2, -3) = 0.125`,
    slides: [
      {
        lectureId: 'aip_cpp_textbook',
        page: 27,
        label: 'Учебник C++ · Метод хорд, задание 8 (стр. 27)',
        isAnswerSlide: true,
      },
      {
        lectureId: 'aip_cpp_textbook',
        page: 30,
        label: 'Учебник C++ · Рекурсивная степень, задание 17 (стр. 30)',
      },
    ],
  },
  {
    id: 'aip-tb-ch6-lists',
    kind: 'exam',
    badgeNumber: 'Гл. 6 · №7 & 9',
    title: 'Односвязный список (удалить > среднего) и кольцевой список (считалка Иосифа)',
    chapter: 'Учебник C++ · Глава 6 (Списки)',
    problemStatement:
      '1) Введите числа до «#» в односвязный список, удалите элементы больше среднего и выведите остаток в обратном порядке. 2) На кольцевом списке определите водящего при n игроках и m словах считалки.',
    algorithmSummary:
      'Добавление в голову односвязного списка сразу даёт обратный порядок; удаление удобно делать через указатель на указатель `Node **p = &first`. В кольцевом списке `last->next = first`, шагаем m−1 раз и удаляем `cur`.',
    explanationSteps: [
      {
        title: '1. Удаление через Node** (без отдельного случая для головы)',
        detail: 'При `Node **p = &first` перепривязка `*p = q->next; delete q;` одинаково работает и для первого элемента списка, и для середины.',
      },
      {
        title: '2. Задача Иосифа на кольцевом списке',
        detail: 'Пока `cur->next != cur`, сдвигаем пару `(prev, cur)` на `m - 1` шагов, исключаем `cur` и освобождаем его память.',
      },
    ],
    code: `// Считалка на кольцевом списке (n игроков, m слов):
struct Node { int id; Node *next; };
Node *first = nullptr, *last = nullptr;
for (int i = 1; i <= n; i++) {
    Node *q = new Node{i, nullptr};
    if (last) last->next = q; else first = q;
    last = q;
}
last->next = first;
Node *prev = last, *cur = first;
while (cur->next != cur) {
    for (int i = 1; i < m; i++) { prev = cur; cur = cur->next; }
    prev->next = cur->next;
    delete cur;
    cur = prev->next;
}
cout << cur->id; delete cur;`,
    expectedOutput: `При n = 7, m = 3 → водящий: 4`,
    slides: [
      {
        lectureId: 'aip_cpp_textbook',
        page: 32,
        label: 'Учебник C++ · Односвязный список, задание 7 (стр. 32)',
      },
      {
        lectureId: 'aip_cpp_textbook',
        page: 33,
        label: 'Учебник C++ · Кольцевой список, задание 9 (стр. 33)',
        isAnswerSlide: true,
      },
    ],
  },
  {
    id: 'aip-tb-ch7-bst',
    kind: 'exam',
    badgeNumber: 'Гл. 7 · №6–7',
    title: 'Сортированное бинарное дерево (BST): вставка, 3 обхода и удаление по ключу',
    chapter: 'Учебник C++ · Глава 7 (Бинарные деревья)',
    problemStatement:
      'Реализуйте шаблонное бинарное сортированное дерево с учётом кратности ключей (`count`): вставка, прямой/симметричный/обратный обходы, удаление узла по ключу и полная очистка памяти.',
    algorithmSummary:
      'Узел хранит `key`, `count`, `left`, `right`. Вставка по ссылке `Node<T>* &r` упрощает подвешивание листа. При удалении узла с двумя детьми переносим минимальный ключ правого поддерева.',
    explanationSteps: [
      {
        title: '1. Три обхода в одной функции walk(r, mode)',
        detail: 'mode == 0 — прямой (до рекурсии), mode == 1 — симметричный (между left и right), mode == 2 — обратный (после обоих поддеревьев).',
      },
      {
        title: '2. Удаление узла с двумя потомками',
        detail: 'Идём в `p = r->right`, затем максимально влево `while (p->left) p = p->left;`. Копируем `key` и `count` в `r`, затем удаляем `k` из правого поддерева.',
      },
    ],
    code: `template<class T> struct Node { T key; int count; Node *left, *right; };

template<class T> void erase(Node<T>* &r, const T &x) {
    if (!r) return;
    if (x < r->key) erase(r->left, x);
    else if (x > r->key) erase(r->right, x);
    else if (!r->left || !r->right) {
        auto q = r;
        r = r->left ? r->left : r->right;
        delete q;
    } else {
        auto p = r->right;
        while (p->left) p = p->left;
        T k = p->key;
        r->key = k; r->count = p->count;
        erase(r->right, k);
    }
}`,
    expectedOutput: `Симметричный обход выводит оставшиеся ключи в отсортированном порядке`,
    slides: [
      {
        lectureId: 'aip_cpp_textbook',
        page: 35,
        label: 'Учебник C++ · Построение и обходы BST, задание 6 (стр. 35)',
      },
      {
        lectureId: 'aip_cpp_textbook',
        page: 36,
        label: 'Учебник C++ · Удаление узла BST, задание 7 (стр. 36)',
        isAnswerSlide: true,
      },
    ],
  },
  {
    id: 'aip-tb-ch8-bin',
    kind: 'exam',
    badgeNumber: 'Гл. 8 · №13–14',
    title: 'Двоичный файл сессии студентов и безопасное удаление двоечников через `temp.dat`',
    chapter: 'Учебник C++ · Глава 8 (Файлы)',
    problemStatement:
      'Создайте двоичный файл структур Student (ФИО и 5 оценок), выведите отличников и средние баллы по предметам, а затем удалите из файла записи студентов, у которых есть оценка < 3.',
    algorithmSummary:
      'Пишем структуры `Student` через `fwrite` в `"wb"`, читаем через `fread` в `"rb"`. Для удаления копируем только успешные записи в `"temp.dat"`, проверяем ошибки, переименовываем оригинал в `.bak` и заменяем.',
    explanationSteps: [
      {
        title: '1. Фиксированный размер записи',
        detail: 'Используем `char fio[120]` вместо `std::string`, потому что `std::string` содержит указатель в кучу и его нельзя сохранять сырым `fwrite`.',
      },
      {
        title: '2. Атомарная замена с резервной копией',
        detail: 'Переименовываем `students.dat` → `students.bak`, затем `temp.dat` → `students.dat`. При сбое восстанавливаем из `.bak`.',
      },
    ],
    code: `struct Student { char fio[120]; int mark[5]; };

FILE *in = fopen("students.dat", "rb"), *out = fopen("temp.dat", "wb");
bool ok = in && out;
if (ok) {
    Student s;
    while (fread(&s, sizeof s, 1, in) == 1) {
        bool pass = true;
        for (int m : s.mark) if (m < 3) pass = false;
        if (pass && fwrite(&s, sizeof s, 1, out) != 1) { ok = false; break; }
    }
    if (ferror(in)) ok = false;
}
if (in) fclose(in);
if (out && fclose(out) != 0) ok = false;
if (ok && rename("students.dat", "students.bak") == 0) {
    if (rename("temp.dat", "students.dat") != 0)
        rename("students.bak", "students.dat");
}`,
    expectedOutput: `Удалены записи с оценкой < 3; резервная копия сохранена в students.bak`,
    slides: [
      {
        lectureId: 'aip_cpp_textbook',
        page: 43,
        label: 'Учебник C++ · Двоичный файл сессии, задание 13 (стр. 43)',
      },
      {
        lectureId: 'aip_cpp_textbook',
        page: 44,
        label: 'Учебник C++ · Корректировка файла, задание 14 (стр. 44)',
        isAnswerSlide: true,
      },
    ],
  },
];
