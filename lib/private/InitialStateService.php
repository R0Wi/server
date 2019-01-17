<?php
declare(strict_types=1);
/**
 * @copyright Copyright (c) 2019, Roeland Jago Douma <roeland@famdouma.nl>
 *
 * @author Roeland Jago Douma <roeland@famdouma.nl>
 *
 * @license GNU AGPL version 3 or any later version
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of the
 * License, or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 *
 */

namespace OC;

use OCP\IInitialStateService;
use OCP\ILogger;

class InitialStateService implements IInitialStateService {

	/** @var ILogger */
	private $logger;

	/** @var array */
	private $states = [];

	/** @var array */
	private $lazyStates = [];

	public function __construct(ILogger $logger) {
		$this->logger = $logger;
	}

	public function provideInitialState(string $appName, $data) {
		// Scalars and JsonSerializable are fine
		if (is_scalar($data) || $data instanceof \JsonSerializable || is_array($data)) {
			$this->states[$appName] = json_encode($data);
			return;
		}

		$this->logger->warning('Invalid data provided to provideInitialState by ' . $appName);
	}

	public function provideLazyInitialState(string $appName, \Closure $closure) {
		$this->lazyStates[$appName] = $closure;
	}

	public function getInitialStates(): array {
		$states = $this->states;
		foreach ($this->lazyStates as $app => $lazyState) {
			$state = $lazyState();

			if (!($lazyState instanceof \JsonSerializable)) {
				$this->logger->warning($app . ' provided an invalid lazy state');
			}

			$states[$app] = json_encode($state);
		}

		return $states;
	}

}
