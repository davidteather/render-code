---
theme: "dark"
---

# Part One

```python
product_link = a_tag
```

```python
product_link = a_tag.get()
```

```python
product_link = a_tag.get('href')
```

```python
product_link = a_tag.get('href')
product_page = requests.get()
```

```python
product_link = a_tag.get('href')
product_page = requests.get(WEBSITE_URL + product_link)
```

```python
product_link = a_tag.get('href')
product_page = requests.get(WEBSITE_URL + product_link)
product_soup = BeautifulSoup()
```

```python
product_link = a_tag.get('href')
product_page = requests.get(WEBSITE_URL + product_link)
product_soup = BeautifulSoup(product_page.text, 'html.parser')
```